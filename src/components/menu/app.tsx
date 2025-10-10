"use client";
import React, { useState, useEffect, useRef } from "react";
import Menu from "./menu";
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [askModal, setAskModal] = useState(false);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  // useEffect(() => {
  //   if (window.electronAPI) {
  //     const handleBlur = () => {
  //       if (isModalOpen || askModal) {
  //         closeModal();
  //         setAskModal(false);
  //       }
  //     };
  //     window.electronAPI.onWindowBlur(handleBlur);
  //     return () => {
  //       window.electronAPI.removeWindowBlurListener();
  //     };
  //   }
  // }, [isModalOpen, askModal]);
  useEffect(() => {
    if (!window.electronAPI) return;
    const setIgnore = (ignore: boolean) => {
      window.electronAPI.setIgnoreMouseEvents(ignore, { forward: true });
    };
    const isInteractiveAtPoint = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      if (!el) return false;
      return Boolean(el.closest('[data-interactive="true"]'));
    };
    const handleMouseMove = (e: MouseEvent) => {
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
      const overInteractive = isInteractiveAtPoint(e.clientX, e.clientY);
      setIgnore(!overInteractive);
    };
    const handleMouseLeave = () => {
      setIgnore(true);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    setIgnore(false);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);
  const closeModal = () => {
    setIsModalOpen(false);
    setAskModal(false);
    if (window.electronAPI && lastMousePositionRef.current) {
      const { x, y } = lastMousePositionRef.current;
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      const overInteractive = !!(el && el.closest('[data-interactive="true"]'));
      window.electronAPI.setIgnoreMouseEvents(!overInteractive, {
        forward: true,
      });
    }
  };
  const handleTransparentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && (isModalOpen || askModal)) {
      closeModal();
    }
  };
  return (
    <div
      className="w-full  flex items-center justify-center"
      data-interactive={askModal || isModalOpen ? "true" : undefined}
      onClick={handleTransparentClick}
    >
      <Menu askModal={askModal} setAskModal={setAskModal} />
    </div>
  );
}
export default App;
