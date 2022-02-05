# Understanding React UI Rendering

* most expensive thing you can do in the browser is write to the DOM
* react components := *desribe* the UI you want, by returning an element
* element is a plain object describing an html node
* virtual DOM := tree of elements
* reconciliation:
* react creates a tree of elements every time `render` is called
* if an element changes -> DOM node changes
* elements keys are for performance, used as a kind of refrence
    * but this only applies to siblings, not other relationships accross the DOM
* react v reactDOM
    * react is just the diffing between virtual DOMS
	* reactDOM applies the virutalDOM to the browser
	* `render` lives in reactDOM
* JSX is just syntax for React elements
