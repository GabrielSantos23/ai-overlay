import {
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ui/context-menu";

export default function RichTextEditor({
  content,
  onUpdate,
  placeholder,
}: {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const isInternalUpdateRef = useRef(false);

  // Save cursor position with full context
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(editorRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);

      return {
        start: preSelectionRange.toString().length,
        end: preSelectionRange.toString().length + range.toString().length,
      };
    }
    return null;
  };

  // Restore cursor position with better accuracy
  const restoreCursorPosition = (
    savedPosition: { start: number; end: number } | null
  ) => {
    if (!savedPosition || !editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    try {
      const range = document.createRange();
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      let charCount = 0;
      let startNode: Node | null = null;
      let endNode: Node | null = null;
      let startOffset = 0;
      let endOffset = 0;

      let node = walker.nextNode();
      while (node) {
        const nodeLength = node.textContent?.length || 0;

        if (!startNode && charCount + nodeLength >= savedPosition.start) {
          startNode = node;
          startOffset = savedPosition.start - charCount;
        }

        if (!endNode && charCount + nodeLength >= savedPosition.end) {
          endNode = node;
          endOffset = savedPosition.end - charCount;
          break;
        }

        charCount += nodeLength;
        node = walker.nextNode();
      }

      if (startNode) {
        range.setStart(
          startNode,
          Math.min(startOffset, startNode.textContent?.length || 0)
        );
        range.setEnd(
          endNode || startNode,
          endNode
            ? Math.min(endOffset, endNode.textContent?.length || 0)
            : Math.min(startOffset, startNode.textContent?.length || 0)
        );
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.error("Error restoring cursor position:", error);
    }
  };

  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== content &&
      !isInternalUpdateRef.current
    ) {
      const wasFocused = document.activeElement === editorRef.current;
      const savedPosition = wasFocused ? saveCursorPosition() : null;

      editorRef.current.innerHTML = content;

      if (wasFocused && savedPosition) {
        requestAnimationFrame(() => {
          editorRef.current?.focus();
          restoreCursorPosition(savedPosition);
        });
      }
    }

    isInternalUpdateRef.current = false;
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalUpdateRef.current = true;
      onUpdate(editorRef.current.innerHTML);
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    setHasSelection(!!selection && selection.toString().length > 0);
  };

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Handle keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          document.execCommand("bold", false);
          break;
        case "i":
          e.preventDefault();
          document.execCommand("italic", false);
          break;
        case "u":
          e.preventDefault();
          document.execCommand("underline", false);
          break;
        case "k":
          e.preventDefault();
          const keyPointsSection = `
            <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600; color: #e4e4e7;">Key Points</h3>
            <ul style="margin: 0; padding-left: 20px; list-style-type: disc; list-style-position: outside;">
              <li style="margin-bottom: 8px; color: #d4d4d8; display: list-item;">Add your first key point here</li>
            </ul>
          `;
          document.execCommand("insertHTML", false, keyPointsSection);
          handleInput();
          break;
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain");
    const urlRegex =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

    if (urlRegex.test(text.trim())) {
      e.preventDefault();
      const url = text.trim().startsWith("http")
        ? text.trim()
        : `https://${text.trim()}`;
      const link = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${text.trim()}</a>`;
      document.execCommand("insertHTML", false, link);
      handleInput();
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const createLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0) return;

    const url = prompt("Enter URL:", "https://");
    if (url) {
      const link = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${selection.toString()}</a>`;
      document.execCommand("insertHTML", false, link);
      handleInput();
    }
  };

  const changeTextColor = (color: string) => {
    applyFormat("foreColor", color);
  };

  const addKeyPoint = () => {
    const keyPointHtml = `<li style="margin-bottom: 8px; color: #d4d4d8; display: list-item;">Add your key point here</li>`;
    document.execCommand("insertHTML", false, keyPointHtml);
    handleInput();
  };

  return (
    <div className="min-h-[100px] relative">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="outline-none text-zinc-300 focus:bg-zinc-900/30 p-2 rounded -mx-2 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_p]:leading-relaxed [&_p]:whitespace-pre-line [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1"
            data-placeholder={placeholder}
          />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64 bg-zinc-900 border-zinc-800">
          {hasSelection ? (
            <>
              <ContextMenuItem
                onClick={() => applyFormat("bold")}
                className="text-white hover:bg-zinc-800"
              >
                <span className="font-bold mr-2">B</span> Bold
                <span className="ml-auto text-xs text-zinc-500">Ctrl+B</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => applyFormat("italic")}
                className="text-white hover:bg-zinc-800"
              >
                <span className="italic mr-2">I</span> Italic
                <span className="ml-auto text-xs text-zinc-500">Ctrl+I</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => applyFormat("underline")}
                className="text-white hover:bg-zinc-800"
              >
                <span className="underline mr-2">U</span> Underline
                <span className="ml-auto text-xs text-zinc-500">Ctrl+U</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => applyFormat("strikeThrough")}
                className="text-white hover:bg-zinc-800"
              >
                <span className="line-through mr-2">S</span> Strikethrough
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-zinc-800" />
              <ContextMenuItem
                onClick={createLink}
                className="text-white hover:bg-zinc-800"
              >
                🔗 Create Link
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-zinc-800" />
              <ContextMenuItem
                onClick={() => changeTextColor("rgb(248, 113, 113)")}
                className="text-white hover:bg-zinc-800"
              >
                <span className="w-4 h-4 rounded bg-red-400 mr-2"></span> Red
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => changeTextColor("rgb(96, 165, 250)")}
                className="text-white hover:bg-zinc-800"
              >
                <span className="w-4 h-4 rounded bg-blue-400 mr-2"></span> Blue
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => changeTextColor("rgb(134, 239, 172)")}
                className="text-white hover:bg-zinc-800"
              >
                <span className="w-4 h-4 rounded bg-green-400 mr-2"></span>{" "}
                Green
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => changeTextColor("rgb(250, 204, 21)")}
                className="text-white hover:bg-zinc-800"
              >
                <span className="w-4 h-4 rounded bg-yellow-400 mr-2"></span>{" "}
                Yellow
              </ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuItem
                onClick={() => applyFormat("insertUnorderedList")}
                className="text-white hover:bg-zinc-800"
              >
                • Bullet List
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => applyFormat("insertOrderedList")}
                className="text-white hover:bg-zinc-800"
              >
                1. Numbered List
              </ContextMenuItem>
              <ContextMenuItem
                onClick={addKeyPoint}
                className="text-white hover:bg-zinc-800"
              >
                📝 Add Key Point
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-zinc-800" />
              <ContextMenuItem
                onClick={() => applyFormat("formatBlock", "h2")}
                className="text-white hover:bg-zinc-800"
              >
                <span className="text-lg font-semibold mr-2">H</span> Heading
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => applyFormat("formatBlock", "p")}
                className="text-white hover:bg-zinc-800"
              >
                ¶ Paragraph
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-zinc-800" />
              <ContextMenuItem
                onClick={() => {
                  const keyPointsSection = `
                    <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600; color: #e4e4e7;">Key Points</h3>
                    <ul style="margin: 0; padding-left: 20px; list-style-type: disc; list-style-position: outside;">
                      <li style="margin-bottom: 8px; color: #d4d4d8; display: list-item;">Add your first key point here</li>
                    </ul>
                  `;
                  document.execCommand("insertHTML", false, keyPointsSection);
                  handleInput();
                }}
                className="text-white hover:bg-zinc-800"
              >
                📝 Add Key Points Section
                <span className="ml-auto text-xs text-zinc-500">Ctrl+K</span>
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator className="bg-zinc-800" />
          <ContextMenuItem
            onClick={() => {
              document.execCommand("selectAll");
            }}
            className="text-white hover:bg-zinc-800"
          >
            Select All
            <span className="ml-auto text-xs text-zinc-500">Ctrl+A</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {!isFocused && editorRef.current?.textContent === "" && (
        <div className="absolute top-2 left-0 text-zinc-600 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
}
