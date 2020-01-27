var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root"
});

connection.connect(function(err){
    if (err){
        console.error("error connecting: " + err.stack);
    }
    loadManagerMenu();
});

function loadManagerMenu(){
    connection.query("SELECT * FROM products", function(err,res){
        if (err) throw err;

        loadMangerOptions(res);
    });
}

function loadMangerOptions(){
    inquirer
        .prompt({
            type: "list",
            name: "choice",
            choices:["View Products for Sale","View Low Inventory","Add to Inventory","Add New Product","Quit"],
            message: "What would you like to do?"
        })
        .then(function(val){
            switch (val.choice){
                case "View Products for Sale":
                    console.table(products);
                    loadManagerMenu();
                    break;
                case "View Low Inventory":
                    loadLowInventory();
                    break;
                case "Add to Inventory":
                    addToInventory(products);
                    break;
                case "Add New Product":
                    addNewProduct(products);
                    break;
                default:
                    console.log("Goodbye!");
                    process.exit(0);
                    break;
            }
        });
}

function loadLowInventory(){
    connection.query("SELECT * FROM products WHERE stock_quantity <= 5",function(err,res){
        if (err) throw err;
        console.table(res);
        loadManagerMenu();
    });
}

function addToInventory(inventory){
    console.table(inventory);
    inquirer
        .prompt([
            {
                type: "input",
                name: "choice",
                message: "What is the ID of the item you would like add to?",
                validate: function(val){
                    return !NaN(val);
                }
            }
        ])
        .then(function(val){
            var choiceId= parseInt(val.choice);
            var product = checkInventory(choiceId,inventory);

            if (product){
                promptManagerForQuantity(product);
            }
            else {
                console.log("\nThat item is not in the inventory.");
                loadManagerMenu();
            }
        });

}

function promptManagerForQuantity(product){
    inquirer
        .prompt([
            {
                type: "input",
                name: "quantity",
                message: "How many would you like to add?",
                validate: function(val){
                    return val > 0;
                }
            }
        ])
        .then(function(val){
            var quantity = parseInt(val.quantity);
            addQuantity(product,quantity);
        });
}

function addQuantity(product,quantity){
    connection.query(
        "UPDATE products SET stock_quantity = ? WHERE item_id = ?",
        [product.stockquantity + quantity, product.item_id],
        function(err,res){
            console.log("\nSuccessfully added " + quantity + " " + product.product_name + "'s!\n");
            loadManagerMenu();
        }
    );
}

function addNewProduct(){
    getDepartments(function(err,departmets){
        getProductInfo(departmets).then(insertNewProduct);
    });
}

function getProductInfo(departmets){
    return inquirer.prompt([
        {
            type: "input",
            name: "product_name",
            message: "What is the name of the product you would like to add?"
        },
        {
            type: "list",
            name: "department_name",
            choices: getDepartmentNames(departmets),
            message: "Which department does this product fall into?"
        },
        {
            type: "input",
            name: "price",
            message: "How much does this cost?",
            validate: function(val){
                return val > 0;
            }
        },
        {
            type: "input",
            name: "quantity",
            message: "How many do we have?",
            validate: function(val){
                return !isNaN(val);
            }
        }
    ]);
}

function insertNewProduct(val){
    connection.query(
        "INSERT INTO products(product_name,department_name,price,stock_quantity) VALUES (?,?,?,?)",
        [val.product_name, val.department_name, val.price, val.quantity],
        function(err,res){
            if (err) throw err;
            console.log(val.product_name + "ADDED TO BAMAZON!\n");
            loadManagerMenu();
        }
    );
}

function getDepartments(cb){
    connection.query("SELECT * FROM departments", cb);
}

function getDepartmentNames(departments){
    return departments.map(function(department){
        return department.department_name;
    });
}

function checkInventory(choiceId,inventory){
    for (var i = 0; i < inventory.length; i++){
        if (inventory[i].item_id === choiceId){
            return inventory[i];
        }
    }

    return null;
}