import {
  HoverHintDocumentation,
  isVariableDocumentation,
  isObjectDocumentation,
  isFunctionDocumentation,
  FunctionDocumentation,
  DocString,
  ParamDocString,
  ReturnDocString,
} from './types';

// Used to prevent cross-site scripting attacks
const sanitizeHtml = (value: string) => {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

const getContainerStyle = () => {
  return 'font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji; line-height: 1.5; color: #111827;';
};

const getPrimaryTextStyle = () => {
  return 'margin: 0 0 8px 0; color: #111827; white-space: pre-wrap;';
};

const getSecondaryTextStyle = () => {
  return 'color: #374151; white-space: pre-wrap;';
};

const getCodeBlockStyle = () => {
  return 'margin: 0 0 8px 0; padding: 8px; background: #f7f7f8; border: 1px solid #e5e7eb; border-radius: 6px; white-space: pre-wrap; overflow-x: auto;';
};

const getCodeStyle = () => {
  return 'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace; font-size: 12px; color: #111827;';
};

const renderParamDocStringAsHtml = (docString: ParamDocString) => {
  const name = sanitizeHtml(docString.name);
  const documentation = sanitizeHtml(docString.documentation);
  return `<div style="${getPrimaryTextStyle()}">@Param ${name}: ${documentation}</div>`;
};

const renderReturnDocStringAsHtml = (docString: ReturnDocString) => {
  const documentation = sanitizeHtml(docString.documentation);
  return `<div style="${getPrimaryTextStyle()}">@Return: ${documentation}</div>`;
};

const renderDocStringAsHtml = (docString: DocString) => {
  const params = docString.params.map((param) => renderParamDocStringAsHtml(param));
  const returns = renderReturnDocStringAsHtml(docString.returns);
  return `${params.join('')}${returns}`;
};

const renderFunctionDocumentationAsHtml = (documentation: FunctionDocumentation) => {
  const docString = documentation.docString ? renderDocStringAsHtml(documentation.docString) : '';
  const signature = sanitizeHtml(documentation.functionSignature);
  const details = documentation.documentation ? sanitizeHtml(documentation.documentation) : '';

  return `
        <div style="${getContainerStyle()}">
          <pre style="${getCodeBlockStyle()}"><code style="${getCodeStyle()}">${signature}</code></pre>
          ${docString ? `<div style="${getPrimaryTextStyle()}">${docString}</div>` : ''}
          ${details ? `<div style="${getSecondaryTextStyle()}">${details}</div>` : ''}
        </div>
      </div>
    `;
};

const renderPlainTextDocumentationAsHtml = (text: string) => {
  const body = sanitizeHtml(text);
  return `
      <div style="${getContainerStyle()}">
        <div style="${getSecondaryTextStyle()}">${body}</div>
      </div>
    `;
};

export const renderDocumentationAsHtml = (documentation: HoverHintDocumentation) => {
  if (isFunctionDocumentation(documentation)) {
    return renderFunctionDocumentationAsHtml(documentation);
  }

  if (isObjectDocumentation(documentation)) {
    return renderPlainTextDocumentationAsHtml(documentation.docInHtml);
  }

  if (isVariableDocumentation(documentation)) {
    return renderPlainTextDocumentationAsHtml(documentation.docInHtml);
  }

  console.error('Unknown documentation type', documentation);
  return undefined;
};
