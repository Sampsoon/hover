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
} from './types';

// Used to prevent cross-site scripting attacks
function sanitizeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSignatureAsHtml(signature: string) {
  const sanitizedSignature = sanitizeHtml(signature);

  const signatureElement = document.createElement('div');

  applyCodeTextStyle(signatureElement.style);
  applyCodeContainerStyle(signatureElement.style);
  applyTopMarginStyle(signatureElement.style);
  applyBottomMarginStyle(signatureElement.style, MarginSize.LARGE);

  signatureElement.innerHTML = sanitizedSignature;

  return signatureElement;
}

function renderParamDocStringAsHtml(docString: ParamDocString) {
  const name = sanitizeHtml(docString.name);
  const documentation = sanitizeHtml(docString.documentation);
  const div = document.createElement('div');

  applyPrimaryTextStyle(div.style);
  applyBottomMarginStyle(div.style);

  const nameSpan = document.createElement('span');
  applySemiBoldTextStyle(nameSpan.style);
  nameSpan.textContent = name;

  div.innerHTML = `<i>@Param</i> `;
  div.appendChild(nameSpan);
  div.innerHTML += ` — ${documentation}`;
  return div.outerHTML;
}

function renderReturnDocStringAsHtml(docString: ReturnDocString) {
  const documentation = sanitizeHtml(docString.documentation);
  const div = document.createElement('div');
  applyPrimaryTextStyle(div.style);
  applyBottomMarginStyle(div.style);
  div.innerHTML = `<i>@Return</i> — ${documentation}`;
  return div.outerHTML;
}

function renderDocStringAsHtml(docString: DocString) {
  const docStringElement = document.createElement('div');

  applySecondaryTextStyle(docStringElement.style);
  applyTextContainerStyle(docStringElement.style);

  const params = docString.params.map((param) => renderParamDocStringAsHtml(param));
  const returns = renderReturnDocStringAsHtml(docString.returns);
  const renderedText = `${params.join('')}${returns}`;
  docStringElement.innerHTML = renderedText;

  return docStringElement;
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

function renderFunctionDocumentationAsHtml(documentation: FunctionDocumentation) {
  const hoverHintElement = document.createElement('div');

  const signatureElement = renderSignatureAsHtml(documentation.functionSignature);
  hoverHintElement.appendChild(signatureElement);

  if (documentation.docString) {
    const docStringElement = renderDocStringAsHtml(documentation.docString);
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
  const body = sanitizeHtml(documentation.docInHtml);
  const container = document.createElement('div');
  applyTextContainerStyle(container.style);

  const contentDiv = document.createElement('div');
  applyPrimaryTextStyle(contentDiv.style);
  contentDiv.innerHTML = body;

  container.appendChild(contentDiv);
  return container.outerHTML;
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
