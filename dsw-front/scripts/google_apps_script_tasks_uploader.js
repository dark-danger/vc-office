/**
 * ==============================================================================
 * DSW PORTAL - GOOGLE DRIVE TASK & PROOF UPLOADER SCRIPT (Code.gs)
 * ==============================================================================
 * 
 * Target Google Drive Folder:
 * https://drive.google.com/drive/folders/1cljBSpx8NlB24yN_7N0jH7kPBvYY6QHZ
 * 
 * Target Folder ID: 1cljBSpx8NlB24yN_7N0jH7kPBvYY6QHZ
 * 
 * Instructions:
 * 1. Open your Google Apps Script editor (https://script.google.com/)
 * 2. Paste this entire code into `Code.gs` replacing any old code.
 * 3. Click "Save" (Ctrl+S or Cmd+S).
 * 4. Click "Deploy" -> "Manage Deployments" -> Click the Edit (pencil) icon -> Select Version: "New version" -> Click "Deploy".
 *    (Or click "Deploy" -> "New deployment" -> Select type "Web app" -> Execute as: "Me", Who has access: "Anyone" -> Click "Deploy").
 * ==============================================================================
 */

var DEFAULT_PARENT_FOLDER_ID = "1cljBSpx8NlB24yN_7N0jH7kPBvYY6QHZ";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJson({ success: false, message: "No post data received" });
    }

    var data = JSON.parse(e.postData.contents);

    var fileName = (data.fileName || "Proof_Attachment_" + new Date().getTime()).trim();
    var mimeType = data.mimeType || "application/octet-stream";
    var base64Data = data.fileData || "";
    var facultyName = (data.facultyName || data.userName || data.clubName || "General Faculty").trim();
    var taskName = (data.taskName || data.title || "General Duty").trim();
    
    // Resolve Target Folder ID
    var targetFolderId = data.folderId || data.folder_id || data.driveFolderId || data.targetFolderId || DEFAULT_PARENT_FOLDER_ID;

    // 1. Get the Main Parent Drive Folder (1cljBSpx8NlB24yN_7N0jH7kPBvYY6QHZ)
    var parentFolder;
    try {
      parentFolder = DriveApp.getFolderById(targetFolderId);
    } catch (err) {
      parentFolder = DriveApp.getFolderById(DEFAULT_PARENT_FOLDER_ID);
    }

    // 2. Get or Create Faculty / Society Subfolder
    var facultyFolder = getOrCreateSubFolder(parentFolder, facultyName);

    // 3. Get or Create Task Subfolder
    var taskFolder = getOrCreateSubFolder(facultyFolder, taskName);

    // 4. Decode base64 and create file
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var file = taskFolder.createFile(blob);

    // 5. Ensure file is viewable with link
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // Ignore if domain policy handles sharing
    }

    var fileUrl = file.getUrl();
    var downloadUrl = file.getDownloadUrl();

    return responseJson({
      success: true,
      message: "File uploaded successfully",
      fileName: fileName,
      fileId: file.getId(),
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      folderId: taskFolder.getId(),
      folderPath: "DSW Tasks > " + facultyName + " > " + taskName
    });

  } catch (error) {
    return responseJson({
      success: false,
      message: error.toString()
    });
  }
}

function doGet(e) {
  return responseJson({
    status: "active",
    service: "DSW Google Drive Task Uploader",
    targetFolderId: DEFAULT_PARENT_FOLDER_ID,
    folderUrl: "https://drive.google.com/drive/folders/" + DEFAULT_PARENT_FOLDER_ID
  });
}

function getOrCreateSubFolder(parentFolder, folderName) {
  var sanitized = folderName.replace(/[\/\\:*?"<>|]/g, "_").trim();
  if (!sanitized) sanitized = "General";
  var folders = parentFolder.getFoldersByName(sanitized);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(sanitized);
  }
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
