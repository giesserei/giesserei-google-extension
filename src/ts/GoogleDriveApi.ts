const baseUrl = "https://www.googleapis.com/drive/v3/";

export class GoogleDriveApi {

   private accessToken:                string;
   private cachedSharedDrives:         any;

   public constructor (accessToken: string) {
      this.accessToken = accessToken; }

   private async fetchJson (driveFunctionName: string, driveFunctionParms: Record<string,string>) : Promise<any> {
      const sp = new URLSearchParams(driveFunctionParms);
      const url = baseUrl + driveFunctionName + "?" + sp.toString();
      const headers = new Headers({
         Accept: "application/json",                       // eslint-disable-line
         Authorization: "Bearer " + this.accessToken });   // eslint-disable-line
      const rsp = await fetch(url, {headers});
      if (rsp.status != 200) {
         throw new Error(`Google drive API function "${driveFunctionName}" failed, status=${rsp.status}.`); }
      return await rsp.json(); }

   public async getSharedDrives() {
      if (!this.cachedSharedDrives) {
         const parms = {
            pageSize: "100",
            q: "hidden = false",
            fields: "drives(id, name)"};
         const r = await this.fetchJson("drives", parms);
         this.cachedSharedDrives =  r.drives; }
      return this.cachedSharedDrives; }

   // Returns the drive ID or `nothing`.
   // This version does not work without domain admin access, but we don't want to have an access token with admin access on the client.
   // See: https://stackoverflow.com/questions/68794842, https://developers.google.com/drive/api/v3/search-shareddrives
   public async findSharedDriveByName (driveName: string) : Promise<string | undefined> {
      const parms = {
         q: `name = ${quoted(driveName)} and hidden = false`,
         useDomainAdminAccess: "true",                     // this is required for "name=" in q!?
         fields: "drives(id)"};
      const r = await this.fetchJson("drives", parms);
      if (!r.drives?.length) {
         return; }
      return r.drives[0].id; }

   // Returns the drive ID or `nothing`.
   public async findSharedDriveByName_withoutDomainAdminAccess (driveName: string) : Promise<string | undefined> {
      const drives = await this.getSharedDrives();
      for (const drive of drives) {
         if (drive.name == driveName) {
            return drive.id; }}
      return undefined; }

   public async getDirectoryFiles (dirId: string, driveId: string) {
      const parms = {
         pageSize: "1000",
         corpora: "drive",
         driveId,
         q: `'${dirId}' in parents and trashed = false`,
         fields: "files(id, name, mimeType, driveId, webViewLink)",
         orderBy: "folder, name_natural",
         includeItemsFromAllDrives: "true",
         supportsAllDrives: "true" };
      const r = await this.fetchJson("files", parms);
      return r.files; }

   // Returns `undefined` if the file is not found.
   public async findFileByName (fileName: string, dirId: string, driveId: string) {
      const parms = {
         corpora: "drive",
         driveId,
         q: `name = ${quoted(fileName)} and '${dirId}' in parents and trashed = false`,
         fields: "files(id, name, mimeType, driveId, webViewLink)",
         includeItemsFromAllDrives: "true",
         supportsAllDrives: "true" };
      const r = await this.fetchJson("files", parms);
      if (!r.files?.length) {
         return; }
      return r.files[0]; }

   // `path` is an array of path segments.
   // Returns `undefined` if the path is not found.
   public async findPath (path: string[]) {
      if (!path.length) {
         return; }
      const driveName = path[0];
      const driveId = await this.findSharedDriveByName_withoutDomainAdminAccess(driveName);
      if (!driveId) {
         return; }
      if (path.length == 1) {
         return {
            id: driveId,                                   // root folder ID is drive ID
            name: driveName,
            mimeType: "application/vnd.google-apps.folder",
            driveId }; }
      let dirId = driveId;
      let file: any;
      for (let i = 1; i < path.length; i++) {
         file = await this.findFileByName(path[i], dirId, driveId);
         if (!file) {
            return; }
         dirId = file.id; }
      return file; }

   //--- not used ---

// // Can also be used for folders.
// public async getFileInfo (fileId: string) {
//    const parms = {
//       fields: "name, mimeType, driveId, webViewLink",
//       supportsAllDrives: "true" };
//    return await this.fetchJson("files/" + fileId, parms); }

   }

function quoted (s: string) : string {
   return "'" + s.replaceAll("\\", "\\\\").replaceAll("'", "\\'") + "'"; }
