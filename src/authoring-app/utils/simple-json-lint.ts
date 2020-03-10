import LinesAndColumns from "lines-and-columns";

export interface IErrorNotation {
  row: number;
  column: number;
  type: 'warning'|'error'|'info';
  text: string;
  position: number;
}

// Try to provide some better info about
export class JSonParseError extends Error {
  public errorRecord: IErrorNotation;

  constructor(error: Error, json: string) {
      super(error.message);
      // If thinks are broken WRT console names see this:
      // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
      // Set the prototype explicitly …
      Object.setPrototypeOf(this, JSonParseError.prototype);
      this.errorRecord = {
        type: 'error',
        text: this.message,
        row: -1,
        column: -1,
        position: -1
      };

      const flatMessage = this.message.replace(/\n/g, '');
      const indexMatch = flatMessage.match(/at position (\d+)/);
      if (indexMatch && indexMatch.length > 0) {
        const lines = new LinesAndColumns(json);
        const index = Number(indexMatch[1]);
        const location = lines.locationForIndex(index);
        if(location) {
          this.errorRecord.row = location.line;
          this.errorRecord.column = location.column;
          this.errorRecord.position = index;
        }
      }
  }
}

export const SimpleJsonLint = (json:string) => {
	try {
		return JSON.parse(json);
  } catch (error) {
    throw new JSonParseError(error, json);
	}
};

