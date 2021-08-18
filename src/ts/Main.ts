import * as DriveListing from "./DriveListing";

declare var Joomla: any;                                   // eslint-disable-line

function showErrorMessage (msg: string) {
   const contentElement = document.getElementById("gge_content")!;
   const preElement = document.createElement("pre");
   preElement.textContent = msg;
   contentElement.insertAdjacentElement("afterbegin", preElement); }

async function startup3() {
   const jsParms = Joomla.getOptions("com_giessereigoogle");
   switch (jsParms?.view) {
      case "driveListing": {
         await DriveListing.startup(jsParms);
         break; }
      default: {
         throw new Error(`Unsupported view "${jsParms.view}".`); }}}

async function startup2() {
   try {
      await startup3(); }
    catch (e) {
      console.log(e);
      showErrorMessage(e.stack); }}

function startup() {
   void startup2(); }

document.addEventListener("DOMContentLoaded", startup);
