import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

export function renderElement(vNode, container) {
  // vNode를 표준화
  const normalizedVNode = normalizeVNode(vNode);

  // container가 비어있는지 확인하여 최초 렌더링인지 판단
  const isInitialRender = container.children.length === 0;

  if (isInitialRender) {
    // 최초 렌더링: createElement로 DOM을 생성하고 container에 추가
    const element = createElement(normalizedVNode);
    container.appendChild(element);
  } else {
    // 이후 렌더링: updateElement로 기존 DOM을 업데이트
    const oldNode = container._vNode || null; // 이전 vNode 저장
    updateElement(container, normalizedVNode, oldNode);
  }

  // 현재 vNode를 container에 저장 (다음 렌더링을 위해)
  container._vNode = normalizedVNode;

  // 렌더링이 완료되면 container에 이벤트를 등록
  setupEventListeners(container);
}
