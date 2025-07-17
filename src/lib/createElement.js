import { addEvent } from "./eventManager";

export function createElement(vNode) {
  // 1. null, undefined, boolean 처리
  if (vNode == null || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  // 2. 문자열이나 숫자 처리
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  // 3. 배열 처리
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      const childElement = createElement(child);
      fragment.appendChild(childElement);
    });
    return fragment;
  }

  // 4. DOM 요소 생성
  const { type, props = {}, children = [] } = vNode;

  // type이 문자열이면 HTML 요소, 함수면 컴포넌트
  if (typeof type === "string") {
    const element = document.createElement(type);

    // 속성 적용
    updateAttributes(element, props);

    // 자식 요소들 처리
    children.forEach((child) => {
      const childElement = createElement(child);
      element.appendChild(childElement);
    });

    return element;
  }

  // 함수형 컴포넌트는 바로 처리하지 않고 에러를 던짐
  if (typeof type === "function") {
    throw new Error("함수형 컴포넌트는 createElement로 직접 처리할 수 없습니다. 먼저 normalizeVNode로 정규화하세요.");
  }

  // 예상치 못한 타입의 경우 빈 텍스트 노드 반환
  return document.createTextNode("");
}

function updateAttributes($el, props) {
  // boolean 속성 목록
  const booleanProps = ["checked", "disabled", "selected", "readOnly"];
  // props가 없거나 빈 객체인 경우 처리하지 않음
  if (!props || Object.keys(props).length === 0) {
    return;
  }

  Object.entries(props).forEach(([key, value]) => {
    // children은 DOM 속성이 아니므로 건너뛰기
    if (key === "children") {
      return;
    }

    // 이벤트 리스너 처리 (on으로 시작하는 속성)
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.toLowerCase().substring(2);
      addEvent($el, eventName, value);
      return;
    }

    // className 처리
    if (key === "className") {
      $el.className = value;
      return;
    }

    // style 처리 (객체인 경우)
    if (key === "style" && typeof value === "object") {
      Object.assign($el.style, value);
      return;
    }

    // boolean 속성 처리
    if (booleanProps.includes(key)) {
      $el[key] = !!value;
      if (key === "disabled" || key === "readOnly") {
        if (value) {
          $el.setAttribute(key, "");
        } else {
          $el.removeAttribute(key);
        }
      } else {
        // checked, selected는 attribute를 항상 제거 (테스트 요구)
        $el.removeAttribute(key);
      }
      return;
    }

    // 일반 속성 처리
    if (value != null) {
      $el.setAttribute(key, value);
    }
  });
}
