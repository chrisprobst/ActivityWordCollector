/**
 * Created by chrisprobst on 28.12.13.
 */


var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('DataFile');
var _ = require('underscore');

// Prepare table and start server afterwards
db.run("CREATE TABLE IF NOT EXISTS Cards (showA TEXT unique, showB TEXT unique," +
    "drawA TEXT unique, drawB TEXT unique," +
    "explainA TEXT unique, explainB TEXT unique)", runServer);

function runServer() {
    // Import the server stuff
    var express = require('express');
    var app = express();
    var path = require('path');
    var pdf = require('pdfkit');

    // Enable static serving
    app.use(express.static(path.join(__dirname, '../page')));

    // Use body parser
    app.use(express.bodyParser());

    // Listen
    app.listen(8080);


    /*
     A card looks like:
     {
     show: [1, 2],
     draw: [1, 2],
     explain: [1, 2],
     }
     */
    function renderCardToPDF(doc, card) {

        var translator = {
            show: "Pantomime",
            draw: "Zeichnen",
            explain: "Erklären"
        };

        var j = 0;
        for (var key in card) {
            var offset = 50 + 215 * j++;

            // Title
            doc.font('german.ttf')
                .fontSize(42)
                .fillColor("#000000")
                .text(translator[key], 100, offset);

            // HR
            doc.moveTo(50, offset + 50)
                .lineTo(550, offset + 50).stroke();

            // The words
            for (var i = 0; i < card[key].length; i++) {
                doc.font('german.ttf')
                    .fontSize(42)
                    .fillColor("#0000FF")
                    .text(card[key][i], 150, offset + i * 60 + 60);
            }
        }
    }


    function renderPDF(cards, cb) {
        var doc = new pdf();
        for (var i = 0; i < cards.length; i++) {
            // The border
            doc.roundedRect(25, 25, doc.page.width - 50, doc.page.height - 50, 25).stroke();

            // Render a single card
            renderCardToPDF(doc, cards[i]);

            // Add a page
            if (cards.length - i > 1) {
                doc.addPage();
            }
        }
        doc.output(cb);
    }


    // Creates a pdf from the database
    app.get('/print', function (req, res) {
        // Create a pdf
        db.all("SELECT * FROM Cards", function (err, rows) {
            if (err) {
                res.send(err);
            } else {
                function writeToResponse(out) {
                    res.writeHead(200, {"Content-Type": "application/pdf"});
                    res.write(out);
                    res.end();
                }

                // Remap database result
                rows = _.map(rows, function (row) {
                    return {
                        show: [row.showA, row.showB],
                        draw: [row.drawA, row.drawB],
                        explain: [row.explainA, row.explainB]
                    };
                });

                // Finally render als cards as pdf
                renderPDF(rows, writeToResponse)
            }
        });

    });

    var showStack = [];
    var drawStack = [];
    var explainStack = [];

    function checkStacks() {

        // Check stacks
        while (showStack.length >= 2 &&
            drawStack.length >= 2 &&
            explainStack.length >= 2) {

            console.log("Inserting new card...");

            var showA = showStack.shift(),
                showB = showStack.shift(),
                drawA = drawStack.shift(),
                drawB = drawStack.shift(),
                explainA = explainStack.shift(),
                explainB = explainStack.shift();

            if (showA == showB || drawA == drawB || explainA == explainB) {
                return;
            }

            // Store word in data base
            db.run("INSERT INTO Cards VALUES ('"
                + showA + "', '" + showB + "', '"
                + drawA + "', '" + drawB + "', '"
                + explainA + "', '" + explainB
                + "')", function (err, res) {
            });
        }
    }

    // /post posts a new word to the database
    app.post('/post', function (req, res) {

        console.log(req.body);

        // Push to stacks
        if (req.body.show && req.body.show.length >= 3 && req.body.show.length < 25) {
            showStack.push(req.body.show);
        }
        if (req.body.draw && req.body.draw.length >= 3 && req.body.draw.length < 25) {
            drawStack.push(req.body.draw);
        }
        if (req.body.explain && req.body.explain.length >= 3 && req.body.explain.length < 25) {
            explainStack.push(req.body.explain);
        }

        // Look for a new card!
        checkStacks();

        // Finish the response
        res.send(204);
    });

    // The /cards route simply returns all words as json
    app.get('/cards', function (req, res) {
        db.all("SELECT * FROM Cards", function (err, rows) {
            if (err) {
                res.send(err);
            } else {
                res.send(rows);
            }
        });
    });

    // A short log
    console.log('Activity word collector server started!');
}