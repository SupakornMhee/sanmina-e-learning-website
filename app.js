const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require("path");
const fsExtra = require('fs-extra');
const crypto = require('crypto');
app.use(fileUpload());
const port = process.env.PORT || 8080;
app.use(express.static('public'));
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))
app.use(bodyParser.json());
const fs = require("fs");
var lessonList = JSON.parse(fs.readFileSync('./public/js/lesson-list.json').toString());
app.get('/', (req, res) => {
    lessonList.forEach(element => {
        var fName = __dirname + "/views/lesson-file/" + element["href"] + ".pdf";
        if (!fs.existsSync(fName)) {
            fs.openSync(fName, 'w');
        }
        element.available = fs.statSync(fName).size != 0
    });
    fs.writeFileSync('public/js/lesson-list.json', JSON.stringify(lessonList, null, 2));
    if (!fs.existsSync("./public/pwd.txt")) {
        fs.openSync("./public/pwd.txt", 'w');
    }
    let isAdmin = fs.readFileSync("./public/pwd.txt") == crypto.createHash('md5').update("21232f297a57a5a743894a0e4a801fc3").digest('hex');
    res.render('index', { lessonList: lessonList, dir: __dirname, isAdmin: isAdmin })
})
    .get('/display/:name', (req, res) => {
        lessoncName = req.params.name;
        res.sendFile(__dirname + "/views/lesson-file/" + lessoncName + ".pdf");
    })
    .post('/add-name', (req, res) => {
        var lessoncName = req.body["lesson-cname"];
        var lessonName = req.body["lesson-name"];
        lessoncName = lessoncName.replace(/\s+/g, '');
        let valid = true;
        let err = "";
        if (lessoncName.length > 7) {
            err = "Codename must have 7 or less letters. Please Use Another Name."
            valid = false;
        }
        lessonList.forEach(element => {
            if (element["href"] == lessoncName) {
                err = "Codename Taken. Please Use Another Name.";
                valid = false;
            }
            if (element["name"] == lessonName) {
                err = "Lesson Name Taken. Please Use Another Name.";
                valid = false;
            }
        });
        if (valid) {
            let fName = __dirname + "/views/lesson-file/" + lessoncName + ".pdf";
            if (!fs.existsSync(fName)) {
                fs.openSync(fName, 'w');
            }
            lessonList.push({ "name": lessonName, "href": lessoncName, "available":false });
            fs.writeFileSync('public/js/lesson-list.json', JSON.stringify(lessonList, null, 2));
        }
        else {
            console.error(err);
        }
        res.redirect('/');
    })
    .post('/add-file', (req, res) => {
        if (req.files && Object.keys(req.files).length !== 0) {
            const uploadedFile = req.files.chooseFile;
            const cname = req.body["choose-lesson-add"];
            const uploadPath = __dirname
                + "/views/lesson-file/" + lessonList[cname].href + ".pdf";
            const uploadedFileExt = path.extname(uploadedFile.name);
            if (uploadedFileExt == '.pdf') {
                uploadedFile.mv(uploadPath);
            }
        }
        res.redirect('/');
    })
    .post('/remove-file', (req, res) => {
        const iddel = req.body["choose-lesson-rmv"];
        fs.writeFileSync(__dirname + "/views/lesson-file/" + lessonList[iddel].href + ".pdf","");
        res.redirect('/');
    })
    .post('/change-name', (req, res) => {
        let valid = true;
        let err = "";
        const id = req.body["choose-lesson-chnme"];
        var lessonName = req.body["change-name"];
        lessonList.forEach(element => {
            if (element["name"] == lessonName) {
                err = "Lesson Name Taken. Please Use Another Name.";
                valid = false;
            }
        });
        if (valid) {
            lessonList[id].name = lessonName;
            fs.writeFileSync('public/js/lesson-list.json', JSON.stringify(lessonList, null, 2));
        }
        else {
            console.error(err);
        }
        res.redirect('/');
    })
    .post('/change-href', (req, res) => {
        let valid = true;
        let err = "";
        const id = req.body["choose-lesson-chref"];
        var lessoncName = req.body["change-href"];
        lessoncName = lessoncName.replace(/\s+/g, '');
        if (lessoncName.length > 7) {
            err = "Codename must have 7 or less letters. Please Use Another Name.";
            valid = false;
        }
        lessonList.forEach(element => {
            if (element["href"] == lessoncName) {
                err = "Lesson Codename Taken. Please Use Another Name.";
                valid = false;
            }
        });
        if (valid) {
            link1 = __dirname + '/views/lesson-file/' + lessonList[id].href + '.pdf';
            link2 = __dirname + '/views/lesson-file/' + lessoncName + '.pdf';
            lessonList[id].href = lessoncName;
            if (fs.existsSync(link2)) fs.unlinkSync(link2);
            fs.renameSync(link1, link2);
            fs.writeFileSync('public/js/lesson-list.json', JSON.stringify(lessonList, null, 2));
        }
        else {
            console.error(err);
        }
        res.redirect('/');
    })
    .post('/del-name', (req, res) => {
        const iddel = req.body["choose-lesson-del"];
        const delf = req.body["del-file"]
        if (delf) {
            fs.unlinkSync(__dirname + "/views/lesson-file/" + lessonList[iddel].href + ".pdf");
        }
        lessonList.splice(iddel, iddel);
        fs.writeFileSync('public/js/lesson-list.json', JSON.stringify(lessonList, null, 2));
        res.redirect('/');
    })
    .post('/swap-lesson', (req, res) => {
        const id1 = req.body["choose-lesson-s1"];
        const id2 = req.body["choose-lesson-s2"];
        [lessonList[id1], lessonList[id2]] = [lessonList[id2], lessonList[id1]];
        fs.writeFileSync('public/js/lesson-list.json', JSON.stringify(lessonList, null, 2));
        res.redirect('/');
    })
    .post('/reset-lesson', (req, res) => {
        const delf = req.body["reset-files"]
        if (delf) {
            fsExtra.emptyDirSync(__dirname + "/views/lesson-file/");
        }
        res.redirect('/');
    })
    .post('/get-admin', (req, res) => {
        const passwd = req.body["passwd"];
        const passwdHash = crypto.createHash('md5').update(passwd).digest('hex');
        if (passwdHash == "21232f297a57a5a743894a0e4a801fc3") { //DON'T CHANGE THE CONSTANT
            fs.writeFileSync(__dirname + "/public/pwd.txt", crypto.createHash('md5').update(passwdHash).digest('hex'));
        }
        else {
            fs.writeFileSync(__dirname + "/public/pwd.txt","");
        }
        res.redirect('/');
    })
app.listen(port, () => console.info(`App listening on port http://localhost:${port}`))
