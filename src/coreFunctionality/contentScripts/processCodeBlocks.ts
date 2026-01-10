import {
  clearCodeBlockTimeoutIfExists,
  setCodeBlockTimeout,
  setupCodeBlockTracking,
  isCodeBlockInView,
  getOrAddIdToCodeBlock,
  attachIdsToTokens,
  setupIdToElementMapping,
  getOrWrapCodeBlockInContainer,
} from '../htmlProcessing/codeBlocks';
import {
  CodeBlock,
  CodeBlockTrackingState,
  findCodeBlocksOnPage,
  findCodeBlockPartOfMutation,
  IdMappings,
  PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME,
} from '../htmlProcessing';
import { attachHoverHint, setupHoverHintState, setupHoverHintTriggers } from '../hoverHints';
import { invokeHoverHintRetrievalServiceWorker, listenForHoverHintsFromServiceWorker } from '../serviceWorker';

const MS_TO_WAIT_BEFORE_CONSIDERING_CODE_BLOCK_MUTATIONS_STABLE = 800;
const MS_TO_WAIT_BEFORE_CONSIDERING_CODE_BLOCK_IN_VIEW_STABLE = 1000;

const SMALLEST_SCREEN_DIMENSION = Math.min(window.innerWidth, window.innerHeight);
const ROOT_MARGIN_PERCENTAGE = 0.25;

function generateHoverhintsForCodeBlock(codeBlock: CodeBlock, idMappings: IdMappings) {
  attachIdsToTokens(codeBlock, idMappings);
  void invokeHoverHintRetrievalServiceWorker(codeBlock);
}

function processCodeBlock(
  codeBlock: CodeBlock,
  codeBlockProcessingObserver: IntersectionObserver,
  idMappings: IdMappings,
) {
  // We process code blocks that are in view on page load so that there is no delay in showing hover hints
  if (isCodeBlockInView(codeBlock)) {
    generateHoverhintsForCodeBlock(codeBlock, idMappings);
  } else {
    codeBlockProcessingObserver.observe(codeBlock.html);
  }
}

function createCodeBlockProcessingObserver(codeBlockTrackingState: CodeBlockTrackingState, idMappings: IdMappings) {
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const html = entry.target as HTMLElement;
        const { id: codeBlockId } = getOrAddIdToCodeBlock(html);

        clearCodeBlockTimeoutIfExists(codeBlockTrackingState.codeBlocksInViewLookupTable, codeBlockId);

        if (entry.isIntersecting) {
          setCodeBlockTimeout(
            codeBlockTrackingState.codeBlocksInViewLookupTable,
            codeBlockId,
            () => {
              intersectionObserver.unobserve(entry.target as HTMLElement);

              const container: HTMLElement = getOrWrapCodeBlockInContainer(html);
              const codeBlock: CodeBlock = {
                html,
                codeBlockId,
                container,
              };

              generateHoverhintsForCodeBlock(codeBlock, idMappings);
            },
            MS_TO_WAIT_BEFORE_CONSIDERING_CODE_BLOCK_IN_VIEW_STABLE,
          );
        }
      });
    },
    {
      rootMargin: `${(SMALLEST_SCREEN_DIMENSION * ROOT_MARGIN_PERCENTAGE).toFixed(0)}px`,
    },
  );

  return intersectionObserver;
}

function setup() {
  const hoverHintState = setupHoverHintState();

  const codeBlockTrackingState = setupCodeBlockTracking();

  const idMappings = setupIdToElementMapping();

  setupHoverHintTriggers(document, idMappings, hoverHintState);

  listenForHoverHintsFromServiceWorker((hoverHint) => {
    attachHoverHint(hoverHint, hoverHintState, idMappings);
  });

  const codeBlockProcessingObserver = createCodeBlockProcessingObserver(codeBlockTrackingState, idMappings);

  return { codeBlockTrackingState, codeBlockProcessingObserver, idMappings };
}

function processCodeBlocksOnPage(codeBlockProcessingObserver: IntersectionObserver, idMappings: IdMappings) {
  const blocks = findCodeBlocksOnPage(document);
  blocks.forEach((codeBlock) => {
    processCodeBlock(codeBlock, codeBlockProcessingObserver, idMappings);
  });
}

function isMutationProgrammaticallyAddedByChromeExtension(mutation: MutationRecord): boolean {
  if (mutation.type !== 'childList') {
    return false;
  }

  const addedNodes = Array.from(mutation.addedNodes);

  return addedNodes
    .filter((node) => node.nodeType === Node.ELEMENT_NODE)
    .some((node) => {
      const element = node as HTMLElement;
      if (element.hasAttribute(PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME)) {
        return true;
      }

      return element.querySelectorAll(`[${PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME}]`).length > 0;
    });
}

function setupMutationObserver(
  codeBlockTrackingState: CodeBlockTrackingState,
  codeBlockProcessingObserver: IntersectionObserver,
  idMappings: IdMappings,
) {
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const codeBlock = findCodeBlockPartOfMutation(mutation);

      if (!codeBlock) {
        return;
      }

      if (isMutationProgrammaticallyAddedByChromeExtension(mutation)) {
        return;
      }

      const { codeBlockId } = codeBlock;

      clearCodeBlockTimeoutIfExists(codeBlockTrackingState.mutatedCodeBlocksLookupTable, codeBlockId);
      clearCodeBlockTimeoutIfExists(codeBlockTrackingState.codeBlocksInViewLookupTable, codeBlockId);
      codeBlockProcessingObserver.unobserve(codeBlock.html);

      setCodeBlockTimeout(
        codeBlockTrackingState.mutatedCodeBlocksLookupTable,
        codeBlockId,
        () => {
          processCodeBlock(codeBlock, codeBlockProcessingObserver, idMappings);
        },
        MS_TO_WAIT_BEFORE_CONSIDERING_CODE_BLOCK_MUTATIONS_STABLE,
      );
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return mutationObserver;
}

function main() {
  const { codeBlockTrackingState, codeBlockProcessingObserver, idMappings } = setup();

  window.addEventListener('load', () => {
    processCodeBlocksOnPage(codeBlockProcessingObserver, idMappings);
  });

  processCodeBlocksOnPage(codeBlockProcessingObserver, idMappings);

  setupMutationObserver(codeBlockTrackingState, codeBlockProcessingObserver, idMappings);
}

main();
