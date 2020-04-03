// FinalDraft document structure looks like this:
// <FinalDraft> <Content> <Paragraph> <Text> </Text> </Paragraph> </Content> </FinalDraft> 

// Paragraph type attributes could be: Scene Heading, Action, Character, Dialogue, Parenthetical
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
      callbacks.text(texts[j].innerHTML, texts[j].getAttribute("Style"));
    }
    callbacks.paragraphEnd();
  }
  callbacks.documentEnd();
}

// Takes a final draft format XML string and returns a promise
// when resolved it has the string representation in fountain format
export function finalDraftToFountain(fdx) {

  let currentType = '';

  function handleParagraphStart(type) {
    currentType = type;     
    if (currentType === "Scene Heading" || currentType === "Action") {
      output = output + "\n";
    }
  }

  function handleParagraphEnd(type) {    
    output = output + "\n";
    if (currentType === "Action") {
      output = output + "\n";
    }        
    currentType = '';
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

  let output = '';
  let resolver;
  let promise = new Promise(resolve => { resolver = resolve })

  function handleText(str, style) {
    let styles = splitStyles(style);

    const bold = applyBold(str, styles);
    const italic = applyItalic(bold, styles);
    const underline = applyUnderline(italic, styles);
    output = output + underline;
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