import { Plugin, Notice, Menu, WorkspaceLeaf, Editor, MarkdownView } from 'obsidian';
import { Extension, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

// TODO: 
// - Add default shortcuts (or at least mention them in the readme)
// - Add option to overwrite or not overwrite default tab behavior   

export default class DiamondPickaxePlugin extends Plugin {
  async onload() {
	console.log("obsidian-org-cycle loaded")
	   
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
      editorCallback: (editor: Editor, view: MarkdownView) => {
		console.log("obsidian-org-cycle command org-cycle executed")
		editor?.exec('toggleFold')
		return true
      },
    });

    this.addCommand({
      id: 'subtree-indent',
      name: 'Subtree Indent',
      editorCallback: (editor: Editor, view: MarkdownView) => {
		this.indent(editor, 1)
      },
    });

    this.addCommand({
      id: 'subtree-unindent',
      name: 'Subtree Unindent',
      editorCallback: (editor: Editor, view: MarkdownView) => {
		this.indent(editor, -1)
      },
    });

    this.addCommand({
      id: 'subtree-move-up',
      name: 'Subtree Move Up',
      editorCallback: (editor: Editor, view: MarkdownView) => {
      },
    });

    this.addCommand({
      id: 'subtree-move-down',
      name: 'Subtree Move Down',
      editorCallback: (editor: Editor, view: MarkdownView) => {
      },
    });

	this.addCommand({
		id: 'heading-insert',
		name: "Heading Insert",
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

			editor.replaceRange('\n', {line: totalLines, ch: 0})
			editor.replaceRange(headingStr, {line: totalLines+1, ch: 0})
			editor.setCursor({line: totalLines, ch: headingStr.length})
		}
	})
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

	isHeading(line: string) {
		return this.headingLevel(line) > 0
	}

	jungerDoughter(indentChar: string, ln: number) {

	}

	olderDoughter(indentChar: string, ln: number) {

	}

	getNode(ln: number) {

	}

	prevHeadingLevel(editor: Editor, currentLn: number): number {
		const anyHeading = RegExp('^#+ ')
		var activeLn = currentLn;
		while (activeLn >= 0) {
			var line = editor.getLine(activeLn);
			if (anyHeading.test(line)) {
				return this.headingLevel(line)
			}
			activeLn -= 1;
		}
		return 0
	}

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
	
// TODO: Think about how to share the functionality between orgCycle and orgGlobalCycle
// TODO: Think about what is shared functionality between org-indent-subtree and org-cycle
  orgCycle(editor: Editor) {
	editor?.exec('toggleFold')
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

	// toggleOrgCycle(leaf: WorkspaceLeaf) {
		// exec('goUp')
		// const view = leaf.view;
		// const editor = view.editor;
		// const cursor = editor.getCursor();
		// const line = editor.getLine(cursor.line);
		// editor.foldCode({ line: line.number, ch: 0 })
	// }
}