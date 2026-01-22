"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestStatus = exports.ConsignmentStatus = exports.UploadStatus = exports.LabelStatus = void 0;
// Enums
var LabelStatus;
(function (LabelStatus) {
    LabelStatus["AVAILABLE"] = "AVAILABLE";
    LabelStatus["CLAIMED"] = "CLAIMED";
    LabelStatus["EXPIRED"] = "EXPIRED";
    LabelStatus["CANCELLED"] = "CANCELLED";
})(LabelStatus || (exports.LabelStatus = LabelStatus = {}));
var UploadStatus;
(function (UploadStatus) {
    UploadStatus["UPLOADED"] = "UPLOADED";
    UploadStatus["PROCESSING"] = "PROCESSING";
    UploadStatus["COMPLETED"] = "COMPLETED";
    UploadStatus["FAILED"] = "FAILED";
})(UploadStatus || (exports.UploadStatus = UploadStatus = {}));
var ConsignmentStatus;
(function (ConsignmentStatus) {
    ConsignmentStatus["CREATED"] = "CREATED";
    ConsignmentStatus["LABEL_ASSIGNED"] = "LABEL_ASSIGNED";
    ConsignmentStatus["MANIFESTED"] = "MANIFESTED";
    ConsignmentStatus["CANCELLED"] = "CANCELLED";
})(ConsignmentStatus || (exports.ConsignmentStatus = ConsignmentStatus = {}));
var ManifestStatus;
(function (ManifestStatus) {
    ManifestStatus["CREATED"] = "CREATED";
    ManifestStatus["SUBMITTED"] = "SUBMITTED";
    ManifestStatus["PRINTED"] = "PRINTED";
})(ManifestStatus || (exports.ManifestStatus = ManifestStatus = {}));
//# sourceMappingURL=database.types.js.map