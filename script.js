/*imports and global variables*/
const emoji = require("node-emoji");
const os = require("os");
const fs = require("fs");
const puppeteer = require("puppeteer");

const validation = require("./Util/dataValidation");
const utilJs = require("./Util/util");

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

//Emoji used throughout the project
const emojiExclamation = emoji.get("exclamation");
const emojiCross = emoji.get("x");
/*Code snippet to generate date according to pre decided format
Format => Date_Month_Year-Time(HR:MM -> 24 Hrs Format)
*/
const date = utilJs.getDate();

/*Path variables to fetch and store the downloaded database files*/
const findPath = os.homedir() + "/Downloads";
const store = os.homedir() + "/FirebaseBackup";

//Taking Command line args from the user
const args = process.argv.slice(2);
var id = "";
var pass = "";

/*Code to check the input provided by the user*/
if(args.includes("-h") || args.includes("-help")){
  utilJs.showHelpMenu();
  process.exit();
}
if(args.includes("--version") || args.includes("-v")){
  utilJs.showVersion();
  process.exit();
}if (args.length == 0) {
  //no arguments provided open the default case.
  showDefault();
}else if (args.length == 1) {
  //show the error -> no input entered 
  utilJs.noInputFound();
    process.exit();
} 
else {
    id = args[0];
    pass = args[1];
    //checking if the entered emailId and password 
    validation.checkEmailAndPassword(id, pass);
}

//array to store the successful backup and failure backup projects list
let successBackup = [];
let failureBackup = [];

(async function() {
  //function to show the welcome message
  utilJs.welcomeFunction();

  //opening the browser
    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"],
    });

    let page = await login(browser);
    //list to store all the project id's
    let projectIds = [];  
    projectIds = await getProjectsList(page, projectIds);

    //check if user console has any project or not, exit if not found
    if(projectIds.length == 0){
      console.log(emojiCross + " No Firebase Projects Found");
      process.exit();
    }

    //function to download the backup    
    await getDataFromFirebase(projectIds, browser, startUrl, endUrl, expandDB, optionSelector, exportDB);
    
    //close the browser
    await browser.close();

    //closing the Progress Bar
    bar.stop();

    //code to group backup data
    await sortBackups(projectIds);

    //show the success message and analytics to the user
    utilJs.successMessage(date, store, successBackup, failureBackup);
})();

async function getDataFromFirebase(projectIds, browser, startUrl, endUrl, expandDB, optionSelector, exportDB) {
  let set = new Set();

  /* Why do we need to store all the projects in the set?
    There are two types of projects displayed on firebase console home page, Recent projects and all projects.
    The same project is displayed in both of them.
    In order to avoid duplicity we need this set
  */

    //add all projects to the set
  for (let i = 0; i < projectIds.length; i++) {
    set.add(projectIds[i]);
  }
  
  //store the set value in projectId array
  projectIds = Array.from(set);
  
  //initiate the progress bar
  bar.start(projectIds.length, 0);

  for (let i = 0; i < projectIds.length; i++) {
    
    // * update the progress bar
    bar.update(i + 1);
  
    // * Open the browser and export the JSON file for the Realtime database
  let pageNew = await browser.newPage();
  let url = startUrl + projectIds[i] + endUrl;

    await pageNew.goto(url);

    let result = await pageNew.$(createDB);

    // ! if the database exists push it in success list else in failure list

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

// * Function to get the project id list from the firebase console
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

// * function to login to the firebase console
async function login(browser) {
  let pages = await browser.pages();
  let page = pages[0];
  await page.goto("https://console.firebase.google.com/");
  await page.waitForSelector('input[type="email"]');
  await page.click('input[type="email"]');
  await page.type('input[type="email"]', id);

  await page.waitForSelector("#identifierNext");
  await page.click("#identifierNext");
  
  await page.waitForTimeout(1000);

    // ! Selector of the element that shows up when we enter incorrect email or password
  let selectorInvalid = "input[aria-invalid='true']";
  let result = await page.$(selectorInvalid);  

  if(result == null){
    // * the user email entered is correct 

    // * Code to Enter Password begins*/ 
    await page.waitForTimeout(1000);
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', pass);
  
    await page.waitForSelector("#passwordNext");
    await page.click("#passwordNext");
    await page.waitForTimeout(1000);
    
    // * Selector of the element that shows up when we enter incorrect password*/
    let result = await page.$(selectorInvalid);  
    
    if(result == null){
      // ! the password entered was valid
      await page.waitForNavigation();
      return page;
    }else{
      // ! the entered password is wrong
      console.log(emojiCross + " The entered password is incorrect " + emojiCross);
      await page.close();
      process.exit();
    }
  }else{
    //  ! the entered email is wrong
    console.log(emojiCross + " The entered email is incorrect " + emojiCross);
    await page.close();
    process.exit();
  }
}

// * function to set the appearance of the progress bar 
function getProgressBar() {
  return new cliProgress.SingleBar({
    format: _colors.cyan(" {bar}") +
      " {percentage}% | ETA: {eta}s | {value}/{total} Projects",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });
}

// * function to tell the user that no input was provided and the script will use the default input set by the author 
function showDefault() {
  console.log(
    emojiExclamation +
    " no arguments provided using the default email and password " +
    emojiExclamation
  );
    
  // ! Kindly De-Comment the following lines, in order to provide the default email id and password to the script
  /*
  put your id and pass here
  id = "id here";
  pass = "pass here";
  */
}

// * function to sort projects based on their id's
async function sortBackups(projectIds) {
  utilJs.createDir(store);
    for (let i = 0; i < projectIds.length; i++) {
        let projectName = projectIds[i].split("-")[0];
        await findProject(projectName);
    }
}

// * function to move the downloaded backup file the designated folder for that project id
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


