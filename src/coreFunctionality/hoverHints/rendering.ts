import {
  applyCodeContainerStyle,
  applyCodeTextStyle,
  applyPrimaryTextStyle,
  applySecondaryTextStyle,
  applyBottomMarginStyle,
  applyTextContainerStyle,
  applySemiBoldTextStyle,
  MarginSize,
  DocStringCommand,
} from './styles';
import type {
  HoverHintDocumentation,
  ParamDocString,
  ReturnDocString,
  PropertyDocString,
  SignatureStyles,
} from '@hover/shared';
import { IdMappings } from '../htmlProcessing';

// Used to prevent cross-site scripting attacks
function sanitizeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface ResolvedStyle {
  className?: string;
  style?: string;
}

function filterHoverHintIndicatorStyle(style: string | null): string | undefined {
  if (!style) {
    return undefined;
  }

  const filtered = style
    .split(';')
    .map((s) => s.trim())
    .filter((s) => !s.startsWith('text-decoration'))
    .join('; ');

  return filtered || undefined;
}

function resolveStylesFromTokenIds(
  signatureStyles: SignatureStyles,
  idMappings: IdMappings,
): Record<string, ResolvedStyle> {
  const resolvedStyles: Record<string, ResolvedStyle> = {};

  for (const [token, tokenId] of Object.entries(signatureStyles)) {
    const element = idMappings.codeTokenElementMap.get(tokenId);
    if (!element) {
      continue;
    }

    resolvedStyles[token] = {
      className: element.className ? element.className : undefined,
      style: filterHoverHintIndicatorStyle(element.getAttribute('style')),
    };
  }

  return resolvedStyles;
}

function applyStylesToSignature(signature: string, resolvedStyles: Record<string, ResolvedStyle>) {
  for (const [token, styling] of Object.entries(resolvedStyles)) {
    if (!styling.className && !styling.style) {
      continue;
    }

    const classAttr = styling.className ? ` class="${styling.className}"` : '';
    const styleAttr = styling.style ? ` style="${styling.style}"` : '';

    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tokenRegex = new RegExp(`\\b${escapedToken}\\b`, 'g');
    signature = signature.replace(tokenRegex, `<span${classAttr}${styleAttr}>${token}</span>`);
  }

  return signature;
}

interface SignatureStyleContext {
  signatureStyles?: SignatureStyles;
  idMappings: IdMappings;
}

function renderSignatureAsHtml(signature: string, styleContext: SignatureStyleContext) {
  const sanitizedSignature = sanitizeHtml(signature);

  const signatureElement = document.createElement('div');

  applyCodeTextStyle(signatureElement.style);
  applyCodeContainerStyle(signatureElement.style);
  applyBottomMarginStyle(signatureElement.style, MarginSize.LARGE);

  const { signatureStyles, idMappings } = styleContext;

  if (signatureStyles) {
    const resolvedStyles = resolveStylesFromTokenIds(signatureStyles, idMappings);
    signatureElement.innerHTML = applyStylesToSignature(sanitizedSignature, resolvedStyles);
  } else {
    signatureElement.innerHTML = sanitizedSignature;
  }

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

export interface RenderContext {
  idMappings: IdMappings;
}

export function renderDocumentationAsHtml(documentation: HoverHintDocumentation, context: RenderContext) {
  const hoverHintElement = document.createElement('div');

  if (documentation.signature) {
    const signatureElement = renderSignatureAsHtml(documentation.signature, {
      signatureStyles: documentation.signatureStyles,
      idMappings: context.idMappings,
    });

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
