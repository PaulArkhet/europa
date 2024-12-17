export const getTypographyPrompt = () => {
    return `
      Based on the provided style guide, extract typography information and return it in the following exact JSON format:
      {
        "fontFamily": "The exact font family as mentioned in the style guide"
      }
      Ensure that the response is valid JSON and only includes the fontFamily key with its exact value from the style guide.
      Do not include any explanations or extra text, just return the JSON as specified.
      `;
};

export const getButtonPrompt = () => {
    return `
      Based on the provided style guide, generate the CSS properties for four distinct button styles: primary, secondary, outlined, and ghost. Follow these guidelines for each button, ensuring consistency in padding, font size, border color, and border width.
  
      ### Button Specifications:
  
      1. **Primary Button**:
         - Use specific HEX colors from the style guide for the background and text.
         - The text color must follow the exact HEX value from the style guide.
         - The button must always use \`paddingLeft: "20px"\`, \`paddingRight: "20px"\`, \`paddingTop: "12px"\`, \`paddingBottom: "12px"\`,\`fontSize: "11px"\`, \`borderColor: "HEX border color from style guide or none"\`, and \`borderWidth: "0px"\`.
         - On hover, the background color should be a slightly darker shade of the base background color unless otherwise specified in the style guide.
      
      2. **Secondary Button**:
         - Use specific secondary HEX colors for the background and text, with the exact HEX values from the style guide.
         - The button must always use \`paddingLeft: "20px"\`, \`paddingRight: "20px"\`, \`paddingTop: "12px"\`, \`paddingBottom: "12px"\`, \`fontSize: "11px"\`, \`borderColor: "HEX border color from style guide or none"\`, and \`borderWidth: "0px"\`.
         - On hover, the background color should be a slightly darker shade of the base background color unless otherwise specified in the style guide.
      
      3. **Outlined Button**:
         - **Ensure the border color is correct and comes from the style guide.** The background must be transparent.
         - Use specific HEX colors for both the border and the text, and ensure that the border color is taken directly from the style guide.
         - The button must always use \`paddingLeft: "20px"\`, \`paddingRight: "20px"\`, \`paddingTop: "12px"\`, \`paddingBottom: "12px"\`, \`fontSize: "11px"\`, \`borderColor: "HEX border color"\`, and \`borderWidth: "2px"\`.
         - On hover, the background color should apply a slightly darker shade of the **border color**, not the text color, unless otherwise specified in the style guide.
      
      4. **Ghost Button**:
         - No background.
         - The border must be transparent.
         - Use the exact HEX color from the style guide for the text.
         - The button must always use \`paddingLeft: "20px"\`, \`paddingRight: "20px"\`, \`paddingTop: "12px"\`, \`paddingBottom: "12px"\`, \`fontSize: "11px"\`, \`borderColor: "transparent"\`, and \`borderWidth: "1px"\`.
         - On hover, apply a slightly darker shade of the **text color** to the background. The border must remain **transparent** even on hover.
  
      ### Requirements:
      - All buttons must have \`paddingLeft: "20px"\`, \`paddingRight: "20px"\`, \`paddingTop: "12px"\`, \`paddingBottom: "12px"\`,\`fontSize: "11px"\`, \`borderColor\`, and \`borderWidth\` where applicable.
      - Ensure the text colors, background colors, border colors, and border widths follow the **exact HEX values** from the style guide.
      - For hover states: if no specific color is provided in the style guide, darken the background color for primary and secondary buttons by a small amount.
      - For outlined buttons, **the border color must always be correct and from the style guide**. Ensure the border color, not the text color, is darkened on hover.
      - For ghost buttons, the **border must remain transparent** and darken the background using the text color on hover.
  
      ### Return Format:
      Provide the output as a JSON object that matches the following structure:
  
      {
        "primary": {
          "css": {
            "fontSize": "11px",
            "borderRadius": "CSS border-radius here. This should be either 0, 5, 10, 15 or 20px",
            "paddingLeft": "20px",
            "paddingRight": "20px",
            "paddingTop": "12px",
            "paddingBottom": "12px",
            "borderColor": "HEX border color here or none",
            "borderWidth": "0px",  // No border for primary
            "textColor": "HEX text color here",
            "backgroundColor": "HEX background color here",
            "hoveredBackgroundColor": "HEX background color for hover",
            "hoveredTextColor": "HEX text color for hover"
          }
        },
        "secondary": {
          "css": {
            "fontSize": "11px",
            "borderRadius": "CSS border-radius here. This should be either 0, 5, 10, 15 or 20px",
            "paddingLeft": "20px",
            "paddingRight": "20px",
            "paddingTop": "12px",
            "paddingBottom": "12px",
            "borderColor": "HEX border color here or none",
            "borderWidth": "0px",  // No border for secondary
            "textColor": "HEX text color here",
            "backgroundColor": "HEX background color here",
            "hoveredBackgroundColor": "HEX background color for hover",
            "hoveredTextColor": "HEX text color for hover"
          }
        },
        "outlined": {
          "css": {
            "fontSize": "11px",
            "borderRadius": "CSS border-radius here. This should be either 0, 5, 10, 15 or 20px",
            "paddingLeft": "20px",
            "paddingRight": "20px",
            "paddingTop": "12px",
            "paddingBottom": "12px",
            "borderColor": "HEX border color here (make sure this is correct)",
            "borderWidth": "2px",  // Default border width for outlined button
            "textColor": "HEX text color here",
            "backgroundColor": "transparent",  // Transparent background
            "hoveredBackgroundColor": "HEX border color for hover",
            "hoveredTextColor": "HEX text color for hover"
          }
        },
        "ghost": {
          "css": {
            "fontSize": "11px",
            "borderRadius": "CSS border-radius here. This should be either 0, 5, 10, 15 or 20px",
            "paddingLeft": "20px",
            "paddingRight": "20px",
            "paddingTop": "12px",
            "paddingBottom": "12px",
            "borderColor": "transparent",  // Always transparent for ghost button
            "borderWidth": "1px",  // Default border width for ghost button
            "textColor": "HEX text color here",
            "backgroundColor": "transparent",  // No background for ghost button
            "hoveredBackgroundColor": "HEX text color as background for hover",
            "hoveredTextColor": "HEX text color for hover"
          }
        }
      }
  
      Ensure that the output follows the **exact structure** and uses the correct **HEX values** from the style guide for colors, especially for the outlined button's border. All dimensions and styles such as padding, font size, border radius, and hover effects should be derived from the style guide.
    `;
};

export const getRadioButtonPrompt = () => {
    return `
      Provide the inline styles for a RadioButton component, ensuring you apply a balanced mix of **primary, accent, and neutral colors** from the style guide.
  
      RadioButton Specifications:
      1. Focus only on styles that apply to border color, background color, icon size, and dimensions. Do not include any unrelated properties like fontFamily.
      2. The radio button should use colors from the style guide for the border, background, and icon, selecting from **primary, accent, or neutral colors** to achieve a balanced, aesthetically pleasing design.
      3. The radio button border color should use an appropriate HEX color from the style guide for the checked and unchecked states. If the style guide doesn't specify a border color, use a color that complements the style guide.
      6. The radio button should use the following dimensions: height: "24px", width: "24px", borderWidth: "4px", and the custom icon should have height: "8px", width: "8px", borderRadius: "50%".
  
      Return Format:
      Return a JSON object with the following structure:
      {
        "radioButton": {
              "height": "24px",
              "width": "24px",
              "borderColor": "HEX color for the border (use primary, accent, or neutral colors)",
              "borderWidth": "4px",
              "borderRadius": "50%",
              "borderColorChecked": "HEX color for the checked state",
              "customIcon": {
                "height": "8px",
                "width": "8px",
                "backgroundColor": "HEX color for the checked icon",
                "borderRadius": "50%"
              }
            }
          }
    `;
};

export const getInputPrompt = () => {
    return ` 
      Dont' confuse this with Checkbox. This is for Input Field.
      Based on the uploaded style guide, generate inline styles for a TextField component that best mimics the input field example from the guide. The priority is to capture the overall look and feel for **input fields**, but adjust as needed to closely align with the general design principles found in the guide.
  
      Please try first to find the input example in the style guide. If the example is not clear or missing, use the general design principles to create the input field. Don't be confused with other components like buttons or cards.
  
      ### Input Field Requirements:
  
      1. Border Radius:
         - Ensure the border radius follows the input field example from the style guide. Avoid using values from button or other components.
         - If no border radius is specified for input fields, use a standard border radius like \`5px\`.
  
      2. **Border Color**:
         - The border color must be consistent with the **input field section** of the style guide.
         - Do **not** use border colors from other sections, such as buttons. If no color is provided for input fields, default to \`black\` or a neutral color.
  
      3. **Padding & Dimensions**:
         - Apply the padding and dimensions to match the **input field example** in the style guide. If padding isn’t explicitly provided, use default padding values of \`padding: "10px"\`.
  
      4. **Label Positioning**:
         - The label should be positioned either **on top of the input field** or **overlapping** the input field based on the style guide’s example.
         - If positioned on top, use \`marginTop: "-23px"\`. If overlapping, use \`marginTop: "-10px"\`.
         - Ensure the label background and text color follow the style guide’s example. If not specified, use a neutral or transparent background.
  
      5. **Supporting Text**:
         - Style the supporting text below the input field with a smaller font size.
         - The font size for supporting text should be **11px** unless otherwise specified.
         - Use the color for supporting text from the style guide. If not provided, use a neutral gray.
  
      ### General Style Guide Consistency:
  
      - If specific styles for input fields (such as border radius, border color, padding) are **not explicitly provided**, use the most appropriate values based on the overall style guide but **do not** pull styles from unrelated components (such as buttons).
      - The generated input field should match the **input example** provided in the style guide closely, and only pull fallback values from the overall design if the input section is unclear.
  
      ### Example Return Format:
  
      Return a JSON object with the following structure:
  
      {
        "textFieldStyling": {
          "inputStyle": {
            "padding": "10px", // Adjust based on style guide
            "borderWidth": "1px", // Adjust based on input field example
            "borderColor": "HEX color for border (from input field example)",
            "borderStyle": "solid",
            "borderRadius": "Border radius based on input field example. This should be either 0, 5, 10, 15 or 20px",
            "position": "relative",
            "backgroundColor": "HEX background color (from input field example)",
            "color": "HEX text color (from input field example)",
            "clearable": true or false // Based on style guide example
          },
          "labelStyle": {
            "position": "absolute",
            "backgroundColor": "HEX background color for label (use transparent if not provided)",
            "zIndex": 10,
            "marginTop": "-23px", // Use -23px for label on top, -10px if overlapping
            "marginLeft": "10px",
            "padding": "2px 4px"
          },
          "supportingTextStyle": {
            "fontSize": "11px",
            "color": "HEX color for supporting text (from input field example)"
          }
        }
      }
  
      ### Important Notes:
  
      - **Border Radius**: Ensure the border radius is correct based on the input field example in the style guide.
      - **Border Color**: Ensure the border color is accurate and matches the input field section.
      - **Fallbacks**: Only fallback to default or generalized values if no specific input field example is given in the style guide, and never use styles from unrelated sections like buttons or cards.
      - **Label & Supporting Text**: Ensure label and supporting text are styled correctly according to the input field example.
  
      Ensure the input field reflects the **exact design** from the input field section of the style guide, not from unrelated sections such as buttons or cards.
    `;
};

export const getColorPrompt = () => {
    return `
    Based on the provided style guide, extract color information, including the exact color HEX, in the following JSON format:
    {
      "primary": [Hex],  // Exactly 1 primary color
      "accent": [Hex, Hex],  // Exactly 2 accent colors
      "neutral": [Hex, Hex, Hex]  // Exactly 3 neutral colors
    }
    If the style guide provides fewer or more colors than required, or is missing some information, use your best knowledge to select the most accurate and appropriate 1 primary, 2 accent, and 3 neutral colors based on the available information. Ensure the response is as close to the style guide as possible.
    `;
};

export const getTogglePrompt = () => {
    return `
      Use your skills as a frontend developer to create a Toggle component that strictly follows the style guide in terms of colors, border radius, sizes, and the overall feeling of other components. **Ensure a balanced application of primary, accent, and neutral colors**.
  
      The Toggle component should have distinct styles for checked and unchecked states, including:
      - Background colors for checked and unchecked states, using **primary, accent, or neutral colors**.
      - Button colors for checked and unchecked states.
      - Border colors for checked and unchecked states, using **primary, accent, or neutral colors**.
      - Thumb size for checked and unchecked states.
      - Apply the correct border radius and hover state colors for both the Toggle and thumb button as per the style guide.
  
      Where the style guide is ambiguous or lacks specifics, use your creativity to design the most aesthetically pleasing toggle button that fits within the overall style and feeling of other components.
  
      The output should be a single JSON object structured as follows:
  
      {
        "toggle": {
          "isChecked": true,
          "checkedBackgroundColor": "HEX color for background when checked (use primary, accent, or neutral color)",
          "uncheckedBackgroundColor": "HEX color for background when unchecked",
          "checkedButtonColor": "HEX color for button when checked",
          "uncheckedButtonColor": "HEX color for button when unchecked",
          "checkedBorderColor": "HEX color for border when checked",
          "uncheckedBorderColor": "HEX color for border when unchecked",
          "checkedThumbSize": "16px",
          "uncheckedThumbSize": "12px",
          "style": { "height": "24px", "width": "40px" },
          "borderRadius": "border radius of the toggle button. This should be either 0, 5, 10, 15 or 20px"
        }
      }
  
      Ensure that the JSON object is formatted as specified, and uses **primary, accent, and neutral colors** from the style guide to create a visually appealing component.
    `;
};

export const getCheckboxPrompt = () => {
    return `
      Based on the provided style guide, generate inline styles for a CheckBox component that closely resembles the example in the guide. Focus on the following specifications:
  
      CheckBox Specifications:
      1. The CheckBox should use relevant colors from the style guide for the border, background, and checked icon. If the style guide does not explicitly specify these colors, improvise using the most appropriate alternatives.
      2. The CheckBox border color should be a HEX color from the style guide for both the checked and unchecked states. If not specified, use a color that complements the overall design.
  
      Return Format:
      Return a JSON object with the following structure:
      {
        "checkBox": {
          "checkboxBaseStyles": {
            "backgroundColor": "transparent",
            "border": "2px solid HEX color from style guide or '#DEE3E5' if not specified",
            "height": "20px",
            "width": "20px",
            "cursor": "pointer",
            "borderRadius": "Use the value from the style guide if specified, otherwise use '5px'"
          },
          "checkedStyles": {
            "border": "none",
            "color": "HEX color for text when checked",
            "backgroundColor": "HEX color for background when checked"
          },
          "checkedAlternateStyles": {
            "border": "none",
            "color": "HEX color for text when checked",
            "backgroundColor": "HEX color for alternate background when checked"
          }
        }
      }
    `;
};

export const getSegmentedButtonPrompt = () => {
    return `Please refer to the provided style guide and component file to generate a JSON object that follows the given structure for a segmented button. 
    
    Ensure you apply a **balanced use of colors from the style guide**, not just relying on primary colors. Incorporate **accent** and **neutral** colors where appropriate to enhance the visual variety and alignment with the overall design principles. 
  
    Don't confuse this with other components such as Input.
    
    Ensure the colors for 'activeBgColor', 'inactiveBgColor', 'activeTextColor', 'inactiveTextColor', 'borderColor', and 'hoverBgColor' best match the color palette and design guidelines from the style guide, drawing from **primary, accent, and neutral colors** as needed for the most visually appealing design.
  
  Here is the required structure:
  
  {
    "buttonLabels": ["Label", "Label", "Label", "Label"],
    "activeBgColor": "", 
    "inactiveBgColor": "", 
    "activeTextColor": "", 
    "inactiveTextColor": "", 
    "borderColor": "", 
    "hoverBgColor": ""
  }
  
  Fill in the color values based on the style guide's color specifications, ensuring that the 'activeBgColor' stands out for the active button, the 'inactiveBgColor' complements the overall design for inactive buttons, and the text colors ('activeTextColor', 'inactiveTextColor') provide good readability. Make sure the 'borderColor' aligns with the guide's borders and the 'hoverBgColor' feels intuitive on interaction.
  
  Remember to use a variety of colors from the style guide, incorporating **primary, accent, and neutral colors** to create a well-balanced, colorful design.`;
};

export const getCardPrompt = () => {
    return `Please refer to the provided style guide and component file to generate a JSON object that follows the given structure for a card. 
    
    Ensure you apply a **balanced use of colors from the style guide**, not just relying on primary colors. Incorporate **accent** and **neutral** colors where appropriate to enhance the visual variety and alignment with the overall design principles. 
  
    Don't confuse this with other components such as Input.
    
    Ensure the colors for 'activeBgColor', 'inactiveBgColor', 'activeTextColor', 'inactiveTextColor', 'borderColor', and 'hoverBgColor' best match the color palette and design guidelines from the style guide, drawing from **primary, accent, and neutral colors** as needed for the most visually appealing design.
  
  Here is the required structure:
  
  {
    backgroundColor: "",
    borderRadius: "This should be either 0, 5, 10, 15 or 20px",
    border: "0px solid transparent",
    hoveredBackgroundColor: "",
    color: "", (This is for button or accent color on the card)
    textColor: "",
    mainCard: {
      picture: true (dont change this),
      button: true (dont change this),
    },
    subCard: {
      picture: true (dont change this),
    },
    listCard: {
      borderRadius: "0px" (dont change this),
    },
    list: { 
              backgroundColor: "#171D1E",
              textColor: "#D9D9D9",
              color: "#F1B000",
              borderRadius: "0px",
          },
  }
  
  Fill in the color values based on the style guide's color specifications.
  
  Remember to use a variety of colors from the style guide, incorporating **primary, accent, and neutral colors** to create a well-balanced, colorful design.`;
};

export const getTabsPrompt = () => {
    return `Based on the provided style guide, generate the CSS properties for the Tabs component.
    
    {
      internal: {
          borderBottom: 1px solid #303637; (Don't change)
          borderRadius: 0px; (Don't change)
          paddingBottom: 4px (Dont' change);
      };
      active: {
          color: string;
          textDecoration: "" (Don't change);
          textDecorationThickness: "" (Don't change);
          marginBottom:  -4px (Don't change);
          textDecorationOffset: 9px (Don't change);
          borderBottom: 4px solid (Don't change but just add here the HEX color from the style guide);
      };
    }
  
    `;
};

export const getDefaultComponentPrompt = (component: string) => {
    return `
        Style the following ${component} component based on the provided style guide.
        Please use Tailwind CSS classes to style the component.
        Do not return any additional explanations or comments. 
        Also, don't put the \n character in the string.
      `;
};
