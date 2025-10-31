import {
  applyCodeContainerStyle,
  applyCodeTextStyle,
  applyPrimaryTextStyle,
  applySecondaryTextStyle,
  applyBottomMarginStyle,
  applyTextContainerStyle,
  applyTopMarginStyle,
  applySemiBoldTextStyle,
  MarginSize,
  DocStringCommand,
} from './styles';
import {
  HoverHintDocumentation,
  isVariableDocumentation,
  isObjectDocumentation,
  isFunctionDocumentation,
  FunctionDocumentation,
  DocString,
  ParamDocString,
  ReturnDocString,
  ObjectDocumentation,
  VariableDocumentation,
  PropertyDocString,
  TokenToCssStylingMap,
} from './types';

// Used to prevent cross-site scripting attacks
function sanitizeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyTokenToCssStylingMap(signature: string, tokenToCssStylingMap: TokenToCssStylingMap) {
  for (const [token, styling] of Object.entries(tokenToCssStylingMap)) {
    if (!styling.class && !styling.style) {
      continue;
    }

    const classAttr = styling.class ? ` class="${styling.class}"` : '';
    const styleAttr = styling.style ? ` style="${styling.style}"` : '';

    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tokenRegex = new RegExp(`\\b${escapedToken}\\b`, 'g');
    signature = signature.replace(tokenRegex, `<span${classAttr}${styleAttr}>${token}</span>`);
  }

  return signature;
}

function renderSignatureAsHtml(signature: string, tokenToCssStylingMap: TokenToCssStylingMap | undefined) {
  const sanitizedSignature = sanitizeHtml(signature);

  const signatureElement = document.createElement('div');

  applyCodeTextStyle(signatureElement.style);
  applyCodeContainerStyle(signatureElement.style);
  applyTopMarginStyle(signatureElement.style);
  applyBottomMarginStyle(signatureElement.style, MarginSize.LARGE);

  signatureElement.innerHTML = tokenToCssStylingMap
    ? applyTokenToCssStylingMap(sanitizedSignature, tokenToCssStylingMap)
    : sanitizedSignature;

  return signatureElement;
}

function renderDocStringAsHtml(command: DocStringCommand, documentation: string, name?: string) {
  const sanitizedDocumentation = sanitizeHtml(documentation);

  const div = document.createElement('div');

  applyPrimaryTextStyle(div.style);
  applyBottomMarginStyle(div.style);

  if (name) {
    const sanitizedName = sanitizeHtml(name);
    const nameSpan = document.createElement('span');
    applySemiBoldTextStyle(nameSpan.style);
    nameSpan.textContent = sanitizedName;
    div.innerHTML = ` <i>${command}</i> ${nameSpan.outerHTML} — ${sanitizedDocumentation}`;
    return div.outerHTML;
  }

  div.innerHTML = ` <i>${command}</i> — ${sanitizedDocumentation}`;
  return div.outerHTML;
}

function renderParamDocStringAsHtml(docString: ParamDocString) {
  return renderDocStringAsHtml(DocStringCommand.PARAM, docString.documentation, docString.name);
}

function renderReturnDocStringAsHtml(docString: ReturnDocString) {
  return renderDocStringAsHtml(DocStringCommand.RETURN, docString.documentation);
}

function renderObjectPropertyDocStringAsHtml(docString: PropertyDocString) {
  return renderDocStringAsHtml(DocStringCommand.PROPERTY, docString.documentation, docString.name);
}

function renderFunctionDocStringAsHtml(docString: DocString) {
  const docStringElement = document.createElement('div');

  applySecondaryTextStyle(docStringElement.style);
  applyTextContainerStyle(docStringElement.style);

  const params = docString.params.map((param) => renderParamDocStringAsHtml(param));
  const returns = renderReturnDocStringAsHtml(docString.returns);
  const renderedText = `${params.join('')}${returns}`;
  docStringElement.innerHTML = renderedText;

  return docStringElement;
}

function renderObjectPropertiesAsHtml(properties: PropertyDocString[]) {
  const propertiesElement = document.createElement('div');

  applySecondaryTextStyle(propertiesElement.style);
  applyTextContainerStyle(propertiesElement.style);

  const renderedProperties = properties.map((property) => renderObjectPropertyDocStringAsHtml(property));
  propertiesElement.innerHTML = renderedProperties.join('');

  return propertiesElement;
}

function renderFunctionDocumentationTextAsHtml(documentation: string) {
  const sanitizedDocumentation = sanitizeHtml(documentation);
  const documentationElement = document.createElement('div');

  applyPrimaryTextStyle(documentationElement.style);
  applyTextContainerStyle(documentationElement.style);
  applyBottomMarginStyle(documentationElement.style);

  documentationElement.innerHTML = sanitizedDocumentation;

  return documentationElement;
}

function renderObjectDocumentationTextAsHtml(documentation: string) {
  const sanitizedDocumentation = sanitizeHtml(documentation);
  const documentationElement = document.createElement('div');

  applyPrimaryTextStyle(documentationElement.style);
  applyTextContainerStyle(documentationElement.style);
  applyBottomMarginStyle(documentationElement.style);

  documentationElement.innerHTML = sanitizedDocumentation;

  return documentationElement;
}

function renderFunctionDocumentationAsHtml(documentation: FunctionDocumentation) {
  const hoverHintElement = document.createElement('div');

  const signatureElement = renderSignatureAsHtml(documentation.functionSignature, documentation.tokenToCssStylingMap);
  hoverHintElement.appendChild(signatureElement);

  if (documentation.docString) {
    const docStringElement = renderFunctionDocStringAsHtml(documentation.docString);
    hoverHintElement.appendChild(docStringElement);
  }

  if (documentation.documentation) {
    const documentationElement = renderFunctionDocumentationTextAsHtml(documentation.documentation);
    hoverHintElement.appendChild(documentationElement);
  }

  const renderedElement = hoverHintElement.outerHTML;
  hoverHintElement.remove();

  return renderedElement;
}

function renderObjectDocumentationAsHtml(documentation: ObjectDocumentation) {
  const hoverHintElement = document.createElement('div');

  if (documentation.docInHtml) {
    const documentationElement = renderObjectDocumentationTextAsHtml(documentation.docInHtml);
    hoverHintElement.appendChild(documentationElement);
  }

  if (documentation.properties) {
    const propertiesElement = renderObjectPropertiesAsHtml(documentation.properties);
    hoverHintElement.appendChild(propertiesElement);
  }

  const renderedElement = hoverHintElement.outerHTML;
  hoverHintElement.remove();

  return renderedElement;
}

function renderVariableDocumentationAsHtml(documentation: VariableDocumentation) {
  const body = sanitizeHtml(documentation.docInHtml);
  const container = document.createElement('div');
  applyTextContainerStyle(container.style);

  const contentDiv = document.createElement('div');
  applyPrimaryTextStyle(contentDiv.style);
  contentDiv.innerHTML = body;

  container.appendChild(contentDiv);
  return container.outerHTML;
}

export function renderDocumentationAsHtml(documentation: HoverHintDocumentation) {
  if (isFunctionDocumentation(documentation)) {
    return renderFunctionDocumentationAsHtml(documentation);
  }

  if (isObjectDocumentation(documentation)) {
    return renderObjectDocumentationAsHtml(documentation);
  }

  if (isVariableDocumentation(documentation)) {
    return renderVariableDocumentationAsHtml(documentation);
  }

  console.error('Unknown documentation type', documentation);
  return undefined;
}
