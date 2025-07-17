import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

function updateAttributes(target, originNewProps, originOldProps) {
  // boolean 속성 목록
  const booleanProps = ["checked", "disabled", "selected", "readOnly"];

  // 새로운 속성들 적용
  if (originNewProps) {
    Object.entries(originNewProps).forEach(([key, value]) => {
      if (key === "children") return;

      if (key.startsWith("on") && typeof value === "function") {
        // 이벤트 리스너 처리
        const eventName = key.toLowerCase().substring(2);
        const oldValue = originOldProps && originOldProps[key];

        // 이벤트 핸들러가 변경되었을 때만 처리
        if (oldValue !== value) {
          // 이전 핸들러 제거
          if (oldValue && typeof oldValue === "function") {
            removeEvent(target, eventName, oldValue);
          }
          // 새 핸들러 추가
          addEvent(target, eventName, value);
        }
      } else if (key === "className") {
        target.className = value;
      } else if (key === "style" && typeof value === "object") {
        Object.assign(target.style, value);
      } else if (booleanProps.includes(key)) {
        // boolean 타입 속성들은 property로 직접 설정
        target[key] = !!value;
        // checked/selected는 attribute를 DOM에 남기지 않음, disabled/readOnly는 true일 때만 attribute 추가
        if (key === "disabled" || key === "readOnly") {
          if (value) {
            target.setAttribute(key, "");
          } else {
            target.removeAttribute(key);
          }
        } else {
          // checked, selected는 attribute를 항상 제거 (테스트 요구)
          target.removeAttribute(key);
        }
      } else if (value != null) {
        target.setAttribute(key, value);
      }
    });
  }

  // 제거된 속성들 정리
  if (originOldProps) {
    Object.keys(originOldProps).forEach((key) => {
      if (key === "children") return;

      if (!originNewProps || !(key in originNewProps)) {
        if (key.startsWith("on")) {
          const eventName = key.toLowerCase().substring(2);
          // 이벤트 핸들러 제거
          if (originOldProps[key]) {
            removeEvent(target, eventName, originOldProps[key]);
          }
        } else if (key === "className") {
          target.className = "";
          target.removeAttribute("class");
        } else if (booleanProps.includes(key)) {
          // boolean 타입 속성들은 property로 false로 설정하고 attribute도 제거
          target[key] = false;
          target.removeAttribute(key);
        } else {
          target.removeAttribute(key);
        }
      }
    });
  }
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 둘 다 null이면 아무것도 하지 않음
  if (!newNode && !oldNode) return;

  // newNode가 null이면 oldNode 제거
  if (!newNode && oldNode) {
    const child = parentElement.childNodes[index];
    if (child) {
      // 이벤트 핸들러 정리
      if (oldNode.props) {
        Object.entries(oldNode.props).forEach(([key, value]) => {
          if (key.startsWith("on") && typeof value === "function") {
            const eventName = key.toLowerCase().substring(2);
            removeEvent(child, eventName, value);
          }
        });
      }
      parentElement.removeChild(child);
    }
    return;
  }

  // oldNode가 null이면 newNode 추가
  if (newNode && !oldNode) {
    const newElement = createElement(newNode);
    parentElement.appendChild(newElement);
    return;
  }

  // 둘 다 텍스트 노드인 경우
  if (typeof newNode === "string" && typeof oldNode === "string") {
    if (newNode !== oldNode) {
      const child = parentElement.childNodes[index];
      if (child && child.nodeType === Node.TEXT_NODE) {
        child.textContent = newNode;
      }
    }
    return;
  }

  // 텍스트 노드에서 요소 노드로 변경
  if (typeof newNode === "object" && typeof oldNode === "string") {
    const newElement = createElement(newNode);
    const oldChild = parentElement.childNodes[index];
    if (oldChild) {
      parentElement.replaceChild(newElement, oldChild);
    } else {
      parentElement.appendChild(newElement);
    }
    return;
  }

  // 요소 노드에서 텍스트 노드로 변경
  if (typeof newNode === "string" && typeof oldNode === "object") {
    // 기존 요소의 이벤트 핸들러 정리
    const oldElement = parentElement.childNodes[index];
    if (oldElement && oldNode.props) {
      Object.entries(oldNode.props).forEach(([key, value]) => {
        if (key.startsWith("on") && typeof value === "function") {
          const eventName = key.toLowerCase().substring(2);
          removeEvent(oldElement, eventName, value);
        }
      });
    }

    const newTextNode = document.createTextNode(newNode);
    if (oldElement) {
      parentElement.replaceChild(newTextNode, oldElement);
    } else {
      parentElement.appendChild(newTextNode);
    }
    return;
  }

  // 둘 다 요소 노드인 경우
  if (newNode && oldNode && typeof newNode === "object" && typeof oldNode === "object") {
    // 타입이 다르면 교체
    if (newNode.type !== oldNode.type) {
      // 기존 요소의 이벤트 핸들러 정리
      const oldElement = parentElement.childNodes[index];
      if (oldElement && oldNode.props) {
        Object.entries(oldNode.props).forEach(([key, value]) => {
          if (key.startsWith("on") && typeof value === "function") {
            const eventName = key.toLowerCase().substring(2);
            removeEvent(oldElement, eventName, value);
          }
        });
      }

      const newElement = createElement(newNode);
      if (oldElement) {
        parentElement.replaceChild(newElement, oldElement);
      } else {
        parentElement.appendChild(newElement);
      }
      return;
    }

    // 타입이 같으면 속성 업데이트
    const element = parentElement.childNodes[index];
    if (element) {
      updateAttributes(element, newNode.props, oldNode.props);

      // 자식 노드들 재귀적으로 업데이트
      const newChildren = newNode.children || [];
      const oldChildren = oldNode.children || [];
      const minLength = Math.min(oldChildren.length, newChildren.length);

      // 1. 겹치는 부분 먼저 업데이트
      for (let i = 0; i < minLength; i++) {
        updateElement(element, newChildren[i], oldChildren[i], i);
      }

      // 2. oldChildren이 더 많으면 초과 부분 역순으로 제거
      if (oldChildren.length > newChildren.length) {
        for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
          if (element.childNodes[i]) {
            element.removeChild(element.childNodes[i]);
          }
        }
      }
      // 3. newChildren이 더 많으면 초과 부분 정방향으로 추가
      else if (newChildren.length > oldChildren.length) {
        for (let i = oldChildren.length; i < newChildren.length; i++) {
          updateElement(element, newChildren[i], null, i);
        }
      }
    }
  }
}
