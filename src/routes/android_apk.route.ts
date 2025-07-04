import { Hono } from "hono";
import { AndroidApkController } from "@/controllers/android_apk.controller";

const androidApkRoute = new Hono();

// Upload APK
androidApkRoute.post("/upload", AndroidApkController.uploadApk);

// Get all APKs
androidApkRoute.get("/", AndroidApkController.getAllApks);

// Get APKs by package name
androidApkRoute.get("/package/:packageName", AndroidApkController.getApkByPackageName);

// Get latest APK by package name
androidApkRoute.get("/package/:packageName/latest", AndroidApkController.getLatestApkByPackageName);

// Get specific APK by package name and version
androidApkRoute.get("/package/:packageName/version/:version", AndroidApkController.getApkByPackageAndVersion);

// Download APK by ID
androidApkRoute.get("/download/:id", AndroidApkController.downloadApk);

// Delete APK by ID
androidApkRoute.delete("/:id", AndroidApkController.deleteApk);

export default androidApkRoute;
