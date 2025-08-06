// Android APK store model
import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

const AndroidApkSchema = new Schema({
    packageName: { type: String, required: true },
    version: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: false },
    uploadDate: { type: Date, default: Date.now },
});

// Add indexes for better query performance
AndroidApkSchema.index.findByPackageName = { by: "packageName" };
AndroidApkSchema.index.findByVersion = { by: "version" };
AndroidApkSchema.index.findByPackageNameAndVersion = {
    by: ["packageName", "version"],
};

export const AndroidApk = ottoman.model("android_apks", AndroidApkSchema);

// Add static methods to the model
AndroidApk.findByPackageName = async function (packageName: string) {
    try {
        return await this.findOne({ packageName });
    } catch {
        return null;
    }
};

AndroidApk.findByVersion = async function (version: string) {
    try {
        return await this.findOne({ version });
    } catch {
        return null;
    }
};

export type IAndroidApk = {
    packageName: string;
    version: string;
    filePath: string;
    fileSize?: number;
    uploadDate?: Date;
};

export type IAndroidApkDocument = IAndroidApk & {
    _id: string;
    _rev: string;
};

export type IAndroidApkModel = typeof AndroidApk & {
    findByPackageName: (packageName: string) => Promise<IAndroidApkDocument | null>;
    findByVersion: (version: string) => Promise<IAndroidApkDocument | null>;
};
