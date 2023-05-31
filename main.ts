import { Plugin, Menu, WorkspaceLeaf, Editor, MarkdownView } from 'obsidian';
import { Extension, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

// TODO: 
// - Add default shortcuts
// - Add option to overwrite or not overwrite default tab behavior   

export default class OrgCyclePlugin extends Plugin {
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
      id: 'org-cycle',
      name: 'Org cycle',
      editorCallback: (editor: Editor, view: MarkdownView) => {
		this.orgCycle(editor)
      },
    });
    this.addCommand({
      id: 'org-global-cycle',
      name: 'Org global cycle',
      editorCallback: (editor: Editor, view: MarkdownView) => {
		console.log("obsidian-org-cycle command org-cycle executed")
		editor?.exec('toggleFold')
		return true
      },
    });
    this.addCommand({
      id: 'org-indent-subtree',
      name: 'Org global cycle',
      editorCallback: (editor: Editor, view: MarkdownView) => {
		console.log("obsidian-org-cycle command org-cycle executed")
		// Determine if we are at bullet list or heading
		// compute subtree
		// check if we can indent (headings only go to level 6, at least by default)
		// indent all items in subtree
		editor?.exec('toggleFold')
		return true
      },
    });
    this.addCommand({
      id: 'org-unindent-subtree',
      name: 'Org global cycle',
      editorCallback: (editor: Editor, view: MarkdownView) => {
		console.log("obsidian-org-cycle command org-cycle executed")
		editor?.exec('toggleFold')
		return true
      },
    });
	this.addCommand({
		id: 'org-insert-heading',
		name: "Org insert heading",
        editorCallback: (editor: Editor, view: MarkdownView) => {
			const startLn = editor.getCursor().line
			const prevHeadingLevel = this.previousHeadingLevel(editor, startLn)
			const headingStr = "#".repeat(Math.max(1, prevHeadingLevel)) + " "
			const totalLines = editor.lineCount()

			for (let currentLn = startLn + 1; currentLn < totalLines; currentLn++) {
				const line = editor.getLine(currentLn);
				const headingLevel = this.headingLevelOnLine(line)
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

    isListItem(line: string){
		return RegExp('^\s*[-*+]').test(line) || 
		       RegExp('^\s*[0-9]+[).]').test(line)
	}

	isHeading(line: string) {
		return this.headingLevelOnLine(line) > 0
	}

	previousHeadingLevel(editor: Editor, currentLn: number): number {
		const anyHeading = RegExp('^#+')
		var activeLn = currentLn;
		while (true) {
			if (activeLn == 0) {
				return 0
			}
			var line = editor.getLine(activeLn);
			if (anyHeading.test(line)) {
				return this.headingLevelOnLine(line)
			}
			activeLn -= 1;
		}
	}

	headingLevelOnLine(line: string): number {
		const chars = [...line]
		for (let i = 0; i < chars.length; i++) {
			if (chars[i] != '#') {
				return i
			}
		}
		return line.length
	}
	
// TODO: Think about how to share the functionality between orgCycle and orgGlobalCycle
// TODO: Think about what is shared functionality between org-indent-subtree and org-cycle
  orgCycle(editor: Editor) {
	console.log("obsidian-org-cycle command org-cycle executed")
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