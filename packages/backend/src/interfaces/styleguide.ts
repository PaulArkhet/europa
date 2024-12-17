export interface StyleGuide {
    styleguide_id: string;
    filename: string;
    typography: string;
    colors: string;
    buttons: string;
    radiobuttons: string;
    textfields: string;
    toggle: string;
    checkboxes: string;
    internalnavigation: string;
    segmentedbutton: string;
    card: string;
    list: string;
    created_at: string;
    edited_at: string;
    active: boolean;
    user_id: string;
}


export interface StyleGuideRequest {
    pageStructure: string[];
    images: string[];
    styleguideBase64: string;
}