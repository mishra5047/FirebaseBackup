#!/usr/bin/env node

/*imports and global variables*/
const emoji = require("node-emoji");
const os = require("os");
const fs = require("fs");
const puppeteer = require("puppeteer");

const validation = require("./dataValidation");
const utilJs = require("./util");

const cliProgress = require('cli-progress');
const _colors = require("colors");

var bar = getProgressBar();

/* Selectors */
var createDB = ".fire-zero-state-header-button-cta.mat-focus-indicator.mat-raised-button.mat-button-base.mat-primary";
//append the console url
var startUrl = "https://console.firebase.google.com/project/";
var endUrl = "/database";

/*Selectors for menu button, export and expand DB options
*/
var optionSelector = "button[aria-label='Open menu']";
var exportDB = "button[ng-click='controller.showExportDialog()']";
var expandDB = "button[ng-click='controller.expandAll()']";

/*Code snippet to generate date according to pre decided format
Format => Date_Month_Year-Time(HR:MM -> 24 Hrs Format)
*/
const date = utilJs.getDate();

/*Path variables to fetch and store the downloaded database files*/
const findPath = os.homedir() + "/Downloads";
const store = os.homedir() + "/FirebaseBackup";

const args = process.argv.slice(2);
var id = "";
var pass = "";


if(args.includes("-h") || args.includes("-help")){
  utilJs.showHelpMenu();
  process.exit();
}
if(args.includes("--version") || args.includes("-v")){
  utilJs.showVersion();
  process.exit();
}if (args.length == 0) {
  //no arguments provided.
  showDefault();
}else if (args.length == 1) {
  utilJs.noInputFound();
    process.exit();
} 
else {
    id = args[0];
    pass = args[1];

    validation.checkEmailAndPassword(id, pass);
}

let successBackup = [];
let failureBackup = [];


(async function() {
  utilJs.welcomeFunction();

    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"],
    });
    let page = await login(browser);
    let projectIds = [];  
    projectIds = await getProjectsList(page, projectIds);

    if(projectIds.length == 0){
      console.log(emoji.get("exclamation") + " No Firebase Projects Found");
      process.exit();
    }
    
    await getDataFromFirebase(projectIds, browser, startUrl, endUrl, expandDB, optionSelector, exportDB);
    
    await browser.close();

    bar.stop();
    //code to group backup data
    await sortBackups(projectIds);

    utilJs.successMessage(date, store, successBackup, failureBackup);
})();

async function getDataFromFirebase(projectIds, browser, startUrl, endUrl, expandDB, optionSelector, exportDB) {
  let set = new Set();

  for (let i = 0; i < projectIds.length; i++) {
   // bar.update((Math.floor)((i / projectIds.length) * 100));
    set.add(projectIds[i]);
  }
  projectIds = Array.from(set);
  //console.log(projectIds);
  //console.log("length is = " +  projectIds.length);
  bar.start(projectIds.length, 0);

  for (let i = 0; i < projectIds.length; i++) {
  bar.update(i + 1);
  //bar.updateETA(projectIds.length - i);
  let pageNew = await browser.newPage();
  let url = startUrl + projectIds[i] + endUrl;

    await pageNew.goto(url);

    let result = await pageNew.$(createDB);

    if (result === null) {
      successBackup.push(projectIds[i]);
      await pageNew.waitForSelector(expandDB);
      await pageNew.click(expandDB);
      await pageNew.waitForSelector(optionSelector);
      await pageNew.click(optionSelector);
      await pageNew.waitForTimeout(500);
      await pageNew.click(exportDB);
      await pageNew.waitForTimeout(3000);
    }else{
      failureBackup.push(projectIds[i]);
    }
    await pageNew.close();
  }
}

async function getProjectsList(page, projectIds) {
  await page
    .evaluate(function () {
      let selector = ".project-id.ng-star-inserted";
      let projects = document.querySelectorAll(selector);
      let items = [];
      for (let i = 0; i < projects.length; i++) {
        items[i] = document.querySelectorAll(".project-id.ng-star-inserted")[i].textContent;
      }
      return items;
    })
    .then(function (data) {
      projectIds = data;
    });
  return projectIds;
}

async function login(browser) {
  let pages = await browser.pages();
  let page = pages[0];
  await page.goto("https://console.firebase.google.com/");
  await page.waitForSelector('input[type="email"]');
  await page.click('input[type="email"]');
  await page.type('input[type="email"]', id);

  await page.waitForSelector("#identifierNext");
  await page.click("#identifierNext");
  await page.waitForNavigation({
    waitUntil: "networkidle2"
  });
  await page.waitForTimeout(1000);
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', pass);

  await page.waitForSelector("#passwordNext");
  await page.click("#passwordNext");
  await page.waitForNavigation();
  return page;
}



function getProgressBar() {
  return new cliProgress.SingleBar({
    format: _colors.cyan(" {bar}") +
      " {percentage}% | ETA: {eta}s | {value}/{total} Projects",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });
}

function showDefault() {
  console.log(
    emoji.get("exclamation") +
    " no arguments provided using the default email and password " +
    emoji.get("exclamation")
  );

  id = "testemail5047";
  pass = "Test@1234";
}


async function sortBackups(projectIds) {
  utilJs.createDir(store);
    for (let i = 0; i < projectIds.length; i++) {
        let projectName = projectIds[i].split("-")[0];
        await findProject(projectName);
    }
}

async function findProject(projectName) {
    let dir = fs.readdirSync(findPath);
    dir.forEach((item) => {
        if (item.toString().includes(projectName)) {
            utilJs.createDir(store + "/" + projectName);
            utilJs.createDir(store + "/" + projectName + "/" + date);
            //create a new folder under Firebase Backup folder by the name of the project
            fs.copyFile(
                findPath + "/" + item,
                store + "/" + projectName + "/" + date + "/" + (projectName + ".json"),
                (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        utilJs.deleteFile(findPath + "/" + item);
                    }
                }
            );
        }
    });
}


