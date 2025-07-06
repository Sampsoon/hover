import {
  clearCodeBlockTimeoutIfExists,
  CodeBlock,
  CodeBlockTrackingState,
  findCodeBlocksOnPage,
  findCodeBlockPartOfMutation,
  searchForCodeBlockElementIsPartOf,
  setCodeBlockTimeout,
  setupCodeBlockTracking,
  isCodeBlockInView,
} from '../htmlProcessing';
import { LlmInterface, createHoverHintRetrievalLlmInterface } from '../llm';
import {
  attachHoverHints,
  retrieveAnnotations,
  setupHoverHintState,
  setupHoverHintTriggers,
  HoverHintState,
} from '../hoverHints';

const MS_TO_WAIT_BEFORE_CONSIDERING_CODE_BLOCK_MUTATIONS_STABLE = 800;
const MS_TO_WAIT_BEFORE_CONSIDERING_CODE_BLOCK_IN_VIEW_STABLE = 1000;

const SMALLEST_SCREEN_DIMENSION = Math.min(window.innerWidth, window.innerHeight);
const ROOT_MARGIN_PERCENTAGE = 0.25;

async function processCodeBlock(state: HoverHintState, llmInterface: LlmInterface, codeBlock: CodeBlock) {
  console.log('Processing code block');
  const hoverHintList = await retrieveAnnotations(codeBlock, llmInterface);
  attachHoverHints(hoverHintList, state);
}

const createCodeBlockProcessingObserver = (
  hoverHintState: HoverHintState,
  codeBlockTrackingState: CodeBlockTrackingState,
  llmInterface: LlmInterface,
) => {
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const codeBlock = searchForCodeBlockElementIsPartOf(entry.target as HTMLElement);

        if (!codeBlock) {
          return;
        }

        const { codeBlockId } = codeBlock;

        clearCodeBlockTimeoutIfExists(codeBlockTrackingState.codeBlocksInViewLookupTable, codeBlockId);

        if (entry.isIntersecting) {
          setCodeBlockTimeout(
            codeBlockTrackingState.codeBlocksInViewLookupTable,
            codeBlockId,
            () => {
              intersectionObserver.unobserve(entry.target as HTMLElement);
              void processCodeBlock(hoverHintState, llmInterface, codeBlock);
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
  const llmInterface = createHoverHintRetrievalLlmInterface();

  const hoverHintState = setupHoverHintState();

  const codeBlockTrackingState = setupCodeBlockTracking();

  setupHoverHintTriggers(document, hoverHintState);

  const codeBlockProcessingObserver = createCodeBlockProcessingObserver(
    hoverHintState,
    codeBlockTrackingState,
    llmInterface,
  );

  return { codeBlockTrackingState, codeBlockProcessingObserver, hoverHintState, llmInterface };
};

const processCodeBlocksOnPage = (
  hoverHintState: HoverHintState,
  llmInterface: LlmInterface,
  codeBlockProcessingObserver: IntersectionObserver,
) => {
  const blocks = findCodeBlocksOnPage(document);
  blocks.forEach((codeBlock) => {
    // We process code blocks that are in view on page load so that there is no delay in showing hover hints
    if (isCodeBlockInView(codeBlock)) {
      void processCodeBlock(hoverHintState, llmInterface, codeBlock);
    } else {
      codeBlockProcessingObserver.observe(codeBlock.html);
    }
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

      setCodeBlockTimeout(
        codeBlockTrackingState.mutatedCodeBlocksLookupTable,
        codeBlockId,
        () => {
          codeBlockProcessingObserver.observe(codeBlock.html);
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

const { codeBlockTrackingState, codeBlockProcessingObserver, hoverHintState, llmInterface } = setup();

window.addEventListener('load', () => {
  processCodeBlocksOnPage(hoverHintState, llmInterface, codeBlockProcessingObserver);
});

setupMutationObserver(codeBlockTrackingState, codeBlockProcessingObserver);
