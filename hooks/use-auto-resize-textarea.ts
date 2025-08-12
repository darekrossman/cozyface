import { useCallback, useEffect, useRef } from "react";

export const useAutoResizeTextarea = () => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize textarea function
	const autoResizeTextarea = useCallback(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, []);

	// Auto-resize textarea on mount
	useEffect(() => {
		autoResizeTextarea();
	}, [autoResizeTextarea]);

	return {
		textareaRef,
		autoResizeTextarea,
	};
};
