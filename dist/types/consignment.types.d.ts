export interface GenerateLabelRequest {
    AuthorizationToken: string;
    OrderReference: string;
    OrderId: number;
    ServiceId: string;
    Name: string;
    CompanyName?: string;
    AddressLine1: string;
    AddressLine2?: string;
    AddressLine3?: string;
    Town: string;
    Region: string;
    CountryCode: string;
    Postalcode: string;
    DeliveryNote?: string;
    Email?: string;
    Phone?: string;
    OrderCurrency?: string;
    OrderValue?: number;
    PostageCharges?: number;
    Packages: PackageRequest[];
    OrderExtendedProperties?: ExtendedProperty[];
    ServiceConfigItems?: ServiceConfigItem[];
}
export interface PackageRequest {
    SequenceNumber: number;
    PackageWeight: number;
    PackageWidth: number;
    PackageHeight: number;
    PackageDepth: number;
    PackageFormat?: string;
    Items?: ItemRequest[];
}
export interface ItemRequest {
    ItemName: string;
    ProductCode: string;
    Quantity: number;
    UnitValue: number;
    UnitWeight: number;
    Height?: number;
    Width?: number;
    Length?: number;
    ExtendedProperties?: ExtendedProperty[];
}
export interface ExtendedProperty {
    Name: string;
    Value: string;
}
export interface ServiceConfigItem {
    ConfigItemId: string;
    SelectedValue: string;
}
export interface GenerateLabelResponse {
    IsError: boolean;
    ErrorMessage: string;
    LeadTrackingNumber: string;
    Cost: number;
    Currency: string;
    Package: PackageResponse[];
}
export interface PackageResponse {
    SequenceNumber: number;
    TrackingNumber: string;
    PNGLabelDataBase64: string;
    PDFBytesDocumentationBase64: string[];
    LabelWidth: number;
    LabelHeight: number;
}
export interface CancelLabelRequest {
    AuthorizationToken: string;
    OrderReference: string;
}
export interface CancelLabelResponse {
    IsError: boolean;
    ErrorMessage: string;
}
//# sourceMappingURL=consignment.types.d.ts.map