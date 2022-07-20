const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + '/date.js');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

// Establishing a connection with the db.
mongoose.connect("mongodb://localhost:27017/todolistDB");

// Creating itemsSchema.
const itemsSchema = {
    name: String
};

// Creating a db model
const Item = mongoose.model("Item", itemsSchema);

// Creating docs(default items).
const item1 = new Item({
    name: "Wake up!"
});
const item2 = new Item({
    name: "Freshen up!"
});
const item3 = new Item({
    name: "Let's get to work!"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

// Route the HTTP GET request to the home('/') path.
app.get('/', (req, res) => {
    
    Item.find({}, (err, foundItems) => {

        if(foundItems.length === 0){
            Item.insertMany(defaultItems, (err) => {
                if(err) console.log(err);
                else console.log("Succesfully inserted default items.");
            });
            res.redirect('/');
        } else {
            res.render('list', {listTitle: "Today", newListItems: foundItems});
        }     
    });
});

app.get('/:customListName', (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name: customListName}, (err, foundList) => {
        if(!err) {
            if(!foundList){
                // Create a new list and save it in db.
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/' + customListName);
            }
            else{
                // Show an existing list
                res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
});

// Route the HTTP POST requests to the home('/') path.
app.post('/', (req, res) => {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect('/');
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            if(!err){
                foundList.items.push(item);
                foundList.save();
                res.redirect('/' + listName);
            }
        });
    }    
});

// Route the HTTP POST requests to the delete('/delete') path.
app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove({_id: checkedItemId},function(err){
            if(!err) res.redirect('/');
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if(!err) res.redirect('/' + listName);
        });
    }
});

app.get('/about', (req, res) =>{
    res.render('about');
});

// Bind and listen the connections on port 3000 on the localhost.
app.listen(3000, () => {
    console.log("Server is running with port 3000");
});