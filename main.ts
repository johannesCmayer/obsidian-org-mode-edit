import { Plugin, Notice, Menu, WorkspaceLeaf, Editor, MarkdownView } from 'obsidian';
import { Extension, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { test } from 'node:test';

// TODO: 
// - Add default shortcuts (or at least mention them in the readme)
// - Add option to overwrite or not overwrite default tab behavior   

export default class DiamondPickaxePlugin extends Plugin {
  async onload() {
    this.tests()
	this.registerEditorExtension(Prec.highest(keymap.of(
		[{
			key: 'Tab',
			run: (): boolean => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				const editor = activeView?.editor;
				console.log("tab pressed");
				if (editor) {
					return this.orgCycle(editor)
				}
				else {
			        return false
				}
			}
		}])
	));

    this.addCommand({
      id: 'debug1',
      name: 'debug1',
      editorCallback: (editor: Editor, view: MarkdownView) => {
		const ln = editor.getCursor().line
		const block = this.getHeadingBlock(editor, ln)
		if (! block) {
			console.log("no block")
			return
		}
		const [start, end] = block
		const headingText = editor.getRange(
			{line: start, ch: 0}, 
			{line: end, ch: editor.getLine(end).length})

		const prevHeadingLn = this.prevHeadingLn(editor, ln)
		if (! prevHeadingLn) {
			console.log("no heading 1")
			return
	    }
		const prevprevHeadingLn = this.prevHeadingLn(editor, prevHeadingLn, true)
		if (! prevprevHeadingLn) {
			console.log("no heading 2")
			return
	    }

		editor.replaceRange(headingText + "\n", {line: prevprevHeadingLn, ch: 0})
      },
    });
	
    this.addCommand({
      id: 'cycle',
      name: 'Cycle',
      editorCallback: (editor: Editor, view: MarkdownView) => {
		this.orgCycle(editor)
      },
    });

    this.addCommand({
      id: 'cycle-global',
      name: 'Cycle Global',
	  hotkeys: [
		  {
		  modifiers: ['Shift'],
		  key: 'Tab',
		  },
	  ],
      editorCallback: (editor: Editor, view: MarkdownView) => {
		this.globalOrgCycle(editor)
		return true
      },
    });

    this.addCommand({
      id: 'subtree-indent',
      name: 'Subtree Indent',
	  hotkeys: [
		  {
		  modifiers: ['Alt'],
		  key: 'ArrowRight',
		  },
	  ],
      editorCallback: (editor: Editor, view: MarkdownView) => {
		this.indent(editor, 1)
      },
    });

    this.addCommand({
      id: 'subtree-unindent',
      name: 'Subtree Unindent',
	  hotkeys: [
		  {
		  modifiers: ['Alt'],
		  key: 'ArrowLeft',
		  },
	  ],
      editorCallback: (editor: Editor, view: MarkdownView) => {
		this.indent(editor, -1)
      },
    });

    this.addCommand({
      id: 'subtree-move-up',
      name: 'Subtree Move Up',
	  hotkeys: [
		  {
		  modifiers: ['Alt'],
		  key: 'ArrowUp',
		  },
	  ],
      editorCallback: (editor: Editor, view: MarkdownView) => {
		// Get current heading and all content underneeth
		//     find heading
		// find insertion point
		// insert new text
		// calculate offset for original text
		// delete original text
      },
    });

    this.addCommand({
      id: 'subtree-move-down',
      name: 'Subtree Move Down',
	  hotkeys: [
		  {
		  modifiers: ['Alt'],
		  key: 'ArrowDown',
		  },
	  ],
      editorCallback: (editor: Editor, view: MarkdownView) => {
      },
    });

	this.addCommand({
		id: 'heading-insert',
		name: "Heading Insert",
		hotkeys: [
			{
			modifiers: ['Ctrl'],
			key: 'Enter',
			},
		],
        editorCallback: (editor: Editor, view: MarkdownView) => {
			const startLn = editor.getCursor().line
			const prevHeadingLevel = this.prevHeadingLevel(editor, startLn)
			const headingStr = "#".repeat(Math.max(1, prevHeadingLevel)) + " "
			const totalLines = editor.lineCount()

			for (let currentLn = startLn + 1; currentLn < totalLines; currentLn++) {
				const line = editor.getLine(currentLn);
				const headingLevel = this.headingLevel(line)
				if (headingLevel != 0 && headingLevel <= Math.max(1, prevHeadingLevel)) {
					editor.replaceRange(headingStr + "\n", {line: currentLn, ch: 0})
					editor.setCursor({line: currentLn, ch: headingStr.length})
					return
				}
			}

			// Otherwise insert the heading at the end of the document
			editor.replaceRange('\n', {line: totalLines, ch: 0})
			editor.replaceRange(headingStr, {line: totalLines+1, ch: 0})
			editor.setCursor({line: totalLines, ch: headingStr.length})
		}
	})

	this.addCommand({
		id: 'heading-insert-here',
		name: "Heading Insert here",
		hotkeys: [
			{
			modifiers: ['Ctrl', 'Shift'],
			key: 'Enter',
			},
		],
        editorCallback: (editor: Editor, view: MarkdownView) => {
			const cursor = editor.getCursor()
			const prevHeadingLevel = this.prevHeadingLevel(editor, cursor.line)
			const headingStr = "#".repeat(Math.max(1, prevHeadingLevel)) + " "

			editor.replaceRange(headingStr, {line: cursor.line, ch: 0})
			editor.setCursor({line: cursor.line, ch: headingStr.length + cursor.ch})
		}
	})
  }

	prevHeadingLn(editor: Editor, fromLn: number, strict : boolean = false) : number | undefined {
		var currentLn = fromLn
		console.log("current line ", currentLn)
		while (true) {
			if (strict && currentLn < 0 || !strict && currentLn <= 0) {
				break
			}

			if (this.isHeadingFromLn(editor, currentLn)) {
				return currentLn
			}
			currentLn--
		}
	}

	prevHeadingLevel(editor: Editor, fromLn: number) : number {
		const prevHeadingLn = this.prevHeadingLn(editor, fromLn)
	    console.log("prevHeadingLn", prevHeadingLn)
		if (prevHeadingLn) {
			const prevHeadingLine = editor.getLine(prevHeadingLn)
			return this.headingLevel(prevHeadingLine)
		}
		else {
			return 0
		}
	}

	nextHeadingLn(editor: Editor, fromLn: number) : number | undefined {
		/**
		 * This function searches for the next line that contains a heading
		 * downword from a given line, for a heading which has lower or equal 
		 * indentation than the heading which is in the given line or the to 
		 * the next heading above the given line.
		 * 
		 * @param editor
		 * @param fromLn - the line from which to search
		 */
		const prevHeadingLn = this.prevHeadingLn(editor, fromLn) ?? 0
		const prevHeadingLevel = this.headingLevel2(editor, prevHeadingLn)
		const lineCount = editor.lineCount();
		var currentLn = prevHeadingLn + 1
		while (currentLn < lineCount) {
			const currentLine = editor.getLine(currentLn)
			const currentDepth = this.headingLevel(currentLine)
			if (currentDepth != 0 && currentDepth <= prevHeadingLevel) {
				return currentLn
			}
			currentLn++
		}
	}

	endOfHeadingBlock(editor: Editor, fromLn: number) : number {
		const nextHeadingLn = this.nextHeadingLn(editor, fromLn)
		if (nextHeadingLn) {
			return nextHeadingLn - 1
		} 
		else {
			return editor.lineCount() - 1
		}
	}

	getHeadingBlock(editor: Editor, fromLn: number) : [number, number] | undefined {
		const a = this.prevHeadingLn(editor, fromLn)
		const b = this.endOfHeadingBlock(editor, fromLn)
		console.log("X1: ", a, b)
		if (a && b) {
			return [a, b]
		}
	}

    // TDOO add functionality to indent all trees in a selection, if a selection is made
    indent(editor: Editor, ammount: number){
		const ln = editor.getCursor().line
		const line = editor.getLine(ln)
		var indentChar;
		if (this.isHeading(line)) {
			indentChar = "#"
		}
		else if (this.isListItem(line)) {
			indentChar = "\t"
		}
		else {
			indentChar = "\t"
			if (ammount > 0) {
				if (! RegExp('^\\s').test(line)) {
					editor.replaceRange("  ", {line: ln, ch: 0})
				}
				else {
					editor.replaceRange(indentChar.repeat(ammount), {line: ln, ch: 0})
				}
			}
			else if (ammount == -1) {
				if (RegExp('^\t').test(line)) {
					editor.replaceRange(line.substring(1), {line: ln, ch: 0}, {line: ln, ch: line.length})
				}
				else if (RegExp('^  ').test(line)) {
					console.log(1)
					editor.replaceRange(line.substring(2), {line: ln, ch: 0}, {line: ln, ch: line.length})
				}
				
			}
			return
		}
		if (ammount > 0) {
			editor.replaceRange(indentChar.repeat(ammount), {line: ln, ch: 0})
		}
		else if (ammount < 0) {
			var newLine = line
			for (let i = 0; i < -ammount; i++) {
				if (newLine.charAt(0) != indentChar) {
					break
				}
				newLine = newLine.substring(1)
			}
			editor.replaceRange(newLine, {line: ln, ch:0}, {line:ln , ch: line.length})
		}
	}

    isListItem(line: string){
		return RegExp('^\\s*[-*+] ').test(line) || 
		       RegExp('^\\s*[0-9]+[).] ').test(line)
	}

	isHeading(line: string) : boolean {
		return this.headingLevel(line) > 0
	}

	isHeadingFromLn(editor: Editor, ln: number) : boolean {
		return this.isHeading(editor.getLine(ln))
	}

	jungerDoughter(indentChar: string, ln: number) {

	}

	olderDoughter(indentChar: string, ln: number) {

	}

	getNode(ln: number) {

	}

	// prevHeadingLevel(editor: Editor, currentLn: number): number {
	// 	const anyHeading = RegExp('^#+ ')
	// 	var activeLn = currentLn;
	// 	while (activeLn >= 0) {
	// 		var line = editor.getLine(activeLn);
	// 		if (anyHeading.test(line)) {
	// 			return this.headingLevel(line)
	// 		}
	// 		activeLn -= 1;
	// 	}
	// 	return 0
	// }

	headingLevel(line: string): number {
		const chars = [...line]
		for (let i = 0; i < chars.length; i++) {
			if (chars[i] != '#') {
				// This check is to detect tags, and return 0 for them
				if (chars[i] == " ") {
					return i
				}
				else {
					return 0
				}
			}
		}
		return line.length
	}

	headingLevel2(editor: Editor, ln: number) {
		return this.headingLevel(editor.getLine(ln))
	}
	
	globalOrgCycle(editor: Editor) {
		const cursor = editor.getCursor()
		const line = editor.getLine(cursor.line)
		// If not a list or heading unindent line
		if (!(this.isHeading(line) || this.isListItem(line)) 
		    && line.length > 0 && line[0] == '\t') {
			editor.replaceRange("", {line: cursor.line, ch: 0}, {line: cursor.line, ch: 1})
		}
		else {
			editor?.exec('toggleFold')
		}
	}

// TODO: Think about how to share the functionality between orgCycle and orgGlobalCycle
// TODO: Think about what is shared functionality between org-indent-subtree and org-cycle
  orgCycle(editor: Editor) {
	const cursor = editor.getCursor()
	const line = editor.getLine(cursor.line)
	// If not a list or heading insert tab
	if (!(this.isHeading(line) || this.isListItem(line))) {
		editor.replaceRange("\t", cursor)
		editor.setCursor({line: cursor.line, ch: Math.max(0, cursor.ch+1)})
	}
	else {
		editor?.exec('toggleFold')
	}
	// check if we are on a heading or bullet
	// determine fold state of current item
	// if folded: unfold at depth 1
	//     fold all headings in subtree
	//     find all direct subheadings
	//     unfold direct subheadings
	// else if unfolded at depth 1: unfold all
	//     find all subheadins
	//     unfold subheadings
	// else: fold heading
	//     fold all headings in subtree
	return true
  }

  tests() {
	

  }

  // CRUFT
	// toggleOrgCycle(leaf: WorkspaceLeaf) {
		// exec('goUp')
		// const view = leaf.view;
		// const editor = view.editor;
		// const cursor = editor.getCursor();
		// const line = editor.getLine(cursor.line);
		// editor.foldCode({ line: line.number, ch: 0 })
	// }
}