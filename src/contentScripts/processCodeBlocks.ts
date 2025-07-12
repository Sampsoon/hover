import {
  clearCodeBlockTimeoutIfExists,
  CodeBlock,
  CodeBlockTrackingState,
  findCodeBlocksOnPage,
  findCodeBlockPartOfMutation,
  setCodeBlockTimeout,
  setupCodeBlockTracking,
  isCodeBlockInView,
  getOrAddIdToCodeBlock,
  attachIdsToTokens,
} from '../htmlProcessing';
import { attachHoverHints, setupHoverHintState, setupHoverHintTriggers, HoverHintState } from '../hoverHints';
import { invokeHoverHintRetrievalServiceWorker } from '../serviceWorkers/interface';

const MS_TO_WAIT_BEFORE_CONSIDERING_CODE_BLOCK_MUTATIONS_STABLE = 800;
const MS_TO_WAIT_BEFORE_CONSIDERING_CODE_BLOCK_IN_VIEW_STABLE = 1000;

const SMALLEST_SCREEN_DIMENSION = Math.min(window.innerWidth, window.innerHeight);
const ROOT_MARGIN_PERCENTAGE = 0.25;

async function generateHoverhintsForCodeBlock(state: HoverHintState, codeBlock: CodeBlock) {
  const time = performance.now();
  console.log('Retrieving annotations for code block:', codeBlock.codeBlockId);

  attachIdsToTokens(codeBlock);
  const hoverHintList = await invokeHoverHintRetrievalServiceWorker(codeBlock);
  attachHoverHints(hoverHintList, state);

  const timeTaken = (performance.now() - time) / 1000;
  console.log('Time taken to retrieve annotations:', timeTaken, 'seconds');
}

const processCodeBlock = (
  codeBlock: CodeBlock,
  hoverHintState: HoverHintState,
  codeBlockProcessingObserver: IntersectionObserver,
) => {
  // We process code blocks that are in view on page load so that there is no delay in showing hover hints
  if (isCodeBlockInView(codeBlock)) {
    void generateHoverhintsForCodeBlock(hoverHintState, codeBlock);
  } else {
    codeBlockProcessingObserver.observe(codeBlock.html);
  }
};

const createCodeBlockProcessingObserver = (
  hoverHintState: HoverHintState,
  codeBlockTrackingState: CodeBlockTrackingState,
) => {
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

              const codeBlock = {
                html,
                codeBlockId,
              };

              void generateHoverhintsForCodeBlock(hoverHintState, codeBlock);
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
};

const setup = () => {
  const hoverHintState = setupHoverHintState();

  const codeBlockTrackingState = setupCodeBlockTracking();

  setupHoverHintTriggers(document, hoverHintState);

  const codeBlockProcessingObserver = createCodeBlockProcessingObserver(hoverHintState, codeBlockTrackingState);

  return { codeBlockTrackingState, codeBlockProcessingObserver, hoverHintState };
};

const processCodeBlocksOnPage = (hoverHintState: HoverHintState, codeBlockProcessingObserver: IntersectionObserver) => {
  const blocks = findCodeBlocksOnPage(document);
  blocks.forEach((codeBlock) => {
    processCodeBlock(codeBlock, hoverHintState, codeBlockProcessingObserver);
  });
};

const setupMutationObserver = (
  codeBlockTrackingState: CodeBlockTrackingState,
  codeBlockProcessingObserver: IntersectionObserver,
) => {
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const codeBlock = findCodeBlockPartOfMutation(mutation);

      if (!codeBlock) {
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
          processCodeBlock(codeBlock, hoverHintState, codeBlockProcessingObserver);
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
};

const { codeBlockTrackingState, codeBlockProcessingObserver, hoverHintState } = setup();

window.addEventListener('load', () => {
  processCodeBlocksOnPage(hoverHintState, codeBlockProcessingObserver);
});

setupMutationObserver(codeBlockTrackingState, codeBlockProcessingObserver);
