import ohm from "ohm-js"
import { BoringLangSemantics } from "../grammar.ohm-bundle"

export const createGetTypesOperation = (semantics: BoringLangSemantics)=>
  semantics.addOperation<ReturnType<ohm.Node['getTypes']>>("getTypes", {
    _iter(...children) {
      return children.map(ch=>ch.getType())
    },
    _terminal() {
      return []
    }
  })