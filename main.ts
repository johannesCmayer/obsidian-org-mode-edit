import { Plugin, Menu, WorkspaceLeaf, Editor, MarkdownView } from 'obsidian';
import { Extension, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

// TODO: 
// - Add default shortcuts
// - Add option to overwrite or not overwrite default tab behavior   

export default class OrgCyclePlugin extends Plugin {
  async onload() {
	const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
	const editor = activeView?.editor;
	console.log("obsidian-org-cycle loaded")
	   
	this.registerEditorExtension(Prec.highest(keymap.of(
		[{
			key: 'Tab',
			run: (): boolean => {
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
      checkCallback: (checking: boolean) => {
      },
    });
    this.addCommand({
      id: 'org-global-cycle',
      name: 'Org global cycle',
      checkCallback: (checking: boolean) => {
		console.log("obsidian-org-cycle command org-cycle executed")
		editor?.exec('toggleFold')
		return true
      },
    });
    this.addCommand({
      id: 'org-indent-subtree',
      name: 'Org global cycle',
      checkCallback: (checking: boolean) => {
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
      checkCallback: (checking: boolean) => {
		console.log("obsidian-org-cycle command org-cycle executed")
		editor?.exec('toggleFold')
		return true
      },
    });
	this.addCommand({
		id: 'org-insert-heading',
		name: "Org insert heading",
		checkCallback: (checking: boolean) => {
			const ln = editor?.getCursor()?.line;
			// find heading level
			// find next heading at this level or lower
			// insert a new heading one line before the next heading
			// move the cursor to the new heading
			if (!ln)
				return false;
			for (let lineNum = ln+1; lineNum <10000; lineNum++)
				if (ln){
					editor?.getLine(ln)
				}
			},
	});
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

	toggleOrgCycle(leaf: WorkspaceLeaf) {
		exec('goUp')
		const view = leaf.view;
		const editor = view.editor;
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		editor.foldCode({ line: line.number, ch: 0 })
	}
}