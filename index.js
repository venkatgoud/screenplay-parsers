// FinalDraft document structure looks like this:
// <FinalDraft> <Content> <Paragraph> <Text> </Text> </Paragraph> </Content> </FinalDraft> 

// Paragraph type attributes could be: Scene Heading, Action, Character, Dialogue, Parenthetical, Transition
// Text Style attributes could be: Bold Italic Underline. 
// Combination Styles are attributed with '+' such as Bold+Italic

// This function parses a FinalDraft XML document and callbacks functions passed
// raises exceptions for invalid documents.
// fdx :  string, XML document of FinalDraft
// callbacks: an object, must contain the following functions
// documentStart - called at the beginning of the document
// documentEnd - called at the end of the document
// paragraphStart - called with the type of paragraph.
// paragraphEnd - called at the end of the paragraph
// text - called with text and style.

export function parseFinalDraft(fdx, callbacks) {
  let domParser = new DOMParser();
  let xmlDoc = domParser.parseFromString(fdx, "text/xml");
  let errors = xmlDoc.getElementsByTagName("parsererror");
  if (errors.length > 0) {
    throw "Could not parse the final draft document.";
  }

  let root = xmlDoc.documentElement;
  if ("FinalDraft" !== root.localName) {
    throw "Not FinalDraft document. Root is not FinalDraft."
  }

  let content = root.firstElementChild;
  if ("Content" !== content.localName) {
    throw "Not FinalDraft document. Content is not a child of FinalDraft."
  }

  if (undefined === callbacks || null === callbacks) {
    throw "No callbacks passed.";
  }
  callbacks.documentStart();
  let paragraphs = content.children;
  for (let i = 0; i < paragraphs.length; i++) {
    let para = paragraphs[i];
    callbacks.paragraphStart(para.getAttribute("Type"));
    let texts = para.children;
    for (let j = 0; j < texts.length; j++) {
      if (texts[j].tagName === "Text") {
        callbacks.text(texts[j].innerHTML, texts[j].getAttribute("Style"));
      }
    }
    callbacks.paragraphEnd();
  }
  callbacks.documentEnd();
}

// Takes a final draft format XML string and returns a promise
// when resolved it has the string representation in fountain format
export function finalDraftToFountain(fdx) {

  let output = '';
  let prevType = '';
  let currentType = '';
  let text = '';
  let resolver;
  let promise = new Promise(resolve => { resolver = resolve })

  function allowedType(type) {
    const paras = ["Scene Heading", "Action", "Character", "Transition", "Dialogue", "Parenthetical"];
    return paras.includes(type);
  }

  function handleParagraphStart(type) {
    if (!allowedType(type))
      return;
    prevType = currentType;
    currentType = type;
  }

  function handleParagraphEnd() {     
    if (!allowedType(currentType))
      return;
    switch (currentType) {
      case "Trasition":
        output += `\n${text}\n\n`;
        break;
      case "Scene Heading":
        if (prevType !== "Transition")
          output += `\n${text}\n\n`;
        else
          output += `\n${text}\n\n`;
        break;
      case "Character":
        if (prevType === "Transition" || prevType === "Scene Heading")
          output += `${text.toUpperCase()}\n`;
        else
          output += `\n${text.toUpperCase()}\n`;
        break;
      case "Parenthetical":
        output += `${text}\n`;
        break;
      case "Dialogue":
        output += `${text}\n`;
        break;
      case "Action":         
        if (prevType === "Dialogue" || prevType === "Parenthetical") {
          output += `\n${text}\n`;
        }
        else {
          output += `${text}\n`;
        }
        break;
      default:
        break;
    }
    text = '';
  }

  function splitStyles(style) {
    if (style != null)
      return style.split("+");
    else
      return [];
  }

  const isBold = (style) => style === "Bold";
  const isItalic = (style) => style === "Italic";
  const isUnderline = (style) => style === "Underline";

  function applyBold(str, styles) {
    if (styles.find(isBold)) {
      return '**' + str + '**';
    }
    return str;
  }

  function applyUnderline(str, styles) {
    if (styles.find(isUnderline)) {
      return '_' + str + '_';
    }
    return str;
  }

  function applyItalic(str, styles) {
    if (styles.find(isItalic)) {
      return '*' + str + '*';
    }
    return str;
  }

  function handleText(str, style) {     
    let styles = splitStyles(style);

    const bold = applyBold(str, styles);
    const italic = applyItalic(bold, styles);
    const underline = applyUnderline(italic, styles);
    if (currentType === "Action" && str === "") {
      text = text + "\n";
    }
    else {
      text += underline;
    }
  }

  let callbacks = {
    documentStart: () => { },
    documentEnd: () => { resolver(output) },
    paragraphStart: handleParagraphStart,
    paragraphEnd: handleParagraphEnd,
    text: handleText
  };

  try {
    parseFinalDraft(fdx, callbacks);
  } catch (error) {
    return Promise.reject(error)
  }

  return promise;
}