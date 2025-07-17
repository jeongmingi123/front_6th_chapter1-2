import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

export function renderElement(vNode, container) {
  // vNode를 표준화
  const normalizedVNode = normalizeVNode(vNode);

  // 이전 vNode 가져오기
  const oldNode = container._vNode;

  if (!oldNode) {
    // 최초 렌더링: createElement로 DOM을 생성하고 container에 추가
    container.innerHTML = ""; // 기존 내용 제거
    const element = createElement(normalizedVNode);
    container.appendChild(element);
  } else {
    // 이후 렌더링: container의 첫 번째 자식을 업데이트
    if (container.firstChild) {
      updateElement(container, normalizedVNode, oldNode, 0);
    } else {
      // 예외적으로 첫 번째 자식이 없는 경우 새로 생성
      const element = createElement(normalizedVNode);
      container.appendChild(element);
    }
  }

  // 현재 vNode를 container에 저장 (다음 렌더링을 위해)
  container._vNode = normalizedVNode;

  // 렌더링이 완료되면 container에 이벤트를 등록
  setupEventListeners(container);
}
