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
  ParamDocString,
  ReturnDocString,
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

function renderDocStringItemAsHtml(command: DocStringCommand, documentation: string, name?: string) {
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

function renderParamAsHtml(param: ParamDocString) {
  return renderDocStringItemAsHtml(DocStringCommand.PARAM, param.documentation, param.name);
}

function renderReturnAsHtml(returns: ReturnDocString) {
  return renderDocStringItemAsHtml(DocStringCommand.RETURN, returns.documentation);
}

function renderPropertyAsHtml(property: PropertyDocString) {
  return renderDocStringItemAsHtml(DocStringCommand.PROPERTY, property.documentation, property.name);
}

function renderPropertiesAsHtml(properties: PropertyDocString[]) {
  const propertiesElement = document.createElement('div');

  applySecondaryTextStyle(propertiesElement.style);
  applyTextContainerStyle(propertiesElement.style);

  const renderedProperties = properties.map((property) => renderPropertyAsHtml(property));
  propertiesElement.innerHTML = renderedProperties.join('');

  return propertiesElement;
}

function renderParamsAndReturnsAsHtml(params: ParamDocString[] | undefined, returns: ReturnDocString | undefined) {
  if (!params?.length && !returns) {
    return null;
  }

  const container = document.createElement('div');

  applySecondaryTextStyle(container.style);
  applyTextContainerStyle(container.style);

  const renderedParams = params?.map((param) => renderParamAsHtml(param)) ?? [];
  const renderedReturns = returns ? renderReturnAsHtml(returns) : '';
  container.innerHTML = `${renderedParams.join('')}${renderedReturns}`;

  return container;
}

function renderDocumentationTextAsHtml(documentation: string) {
  const sanitizedDocumentation = sanitizeHtml(documentation);
  const documentationElement = document.createElement('div');

  applyPrimaryTextStyle(documentationElement.style);
  applyTextContainerStyle(documentationElement.style);
  applyBottomMarginStyle(documentationElement.style);

  documentationElement.innerHTML = sanitizedDocumentation;

  return documentationElement;
}

export function renderDocumentationAsHtml(documentation: HoverHintDocumentation) {
  const hoverHintElement = document.createElement('div');

  if (documentation.signature) {
    const signatureElement = renderSignatureAsHtml(documentation.signature, documentation.tokenToCssStylingMap);
    hoverHintElement.appendChild(signatureElement);
  }

  if (documentation.properties?.length) {
    const propertiesElement = renderPropertiesAsHtml(documentation.properties);
    hoverHintElement.appendChild(propertiesElement);
  }

  const paramsReturnsElement = renderParamsAndReturnsAsHtml(documentation.params, documentation.returns);
  if (paramsReturnsElement) {
    hoverHintElement.appendChild(paramsReturnsElement);
  }

  if (documentation.documentation) {
    const documentationElement = renderDocumentationTextAsHtml(documentation.documentation);
    hoverHintElement.appendChild(documentationElement);
  }

  // Return undefined if nothing was rendered
  if (hoverHintElement.children.length === 0) {
    return undefined;
  }

  const renderedElement = hoverHintElement.outerHTML;
  hoverHintElement.remove();

  return renderedElement;
}
