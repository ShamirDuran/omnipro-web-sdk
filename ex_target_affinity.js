import React, { useEffect } from 'react';
import { chatbotAddon } from './src/adapter/addons/chatbot';

const TargetWrapper = ({ element, props }) => {
  const { location } = props;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.alloy) return;

    const applyTarget = () => {
      if (!window.lastPropositions?.length) return;

      try {
        window.alloy('applyPropositions', {
          propositions: window.lastPropositions.map((prop) => ({
            ...prop,
            renderAttempted: false,
          })),
        });
      } catch (e) {
        console.error('Error reaplicando Target:', e);
      }
    };
    applyTarget();

    if (!window.lastPropositions?.length) {
      window.alloy('sendEvent', { renderDecisions: true }).then((result) => {
        if (result.propositions) {
          console.log(result);
        }
      });
    }

    const targetNode = document?.body;
    let frameId;

    const observer = new MutationObserver((mutations) => {
      const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
      if (hasNewNodes) {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          applyTarget();
        });
      }
    });

    observer.observe(targetNode, { childList: true, subtree: true });

    // Limpieza al desmontar
    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [location.pathname]);
  return element;
};

const wrapPageElement = ({ element, props }) => {
  return <TargetWrapper element={element} props={props} />;
};

const onRouteUpdate = () => {
  chatbotAddon();
};

export default {
  onRouteUpdate,
  wrapPageElement,
};
