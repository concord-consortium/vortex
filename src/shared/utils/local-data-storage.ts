export class LocalDataStorage<DataType> {
  private localStorageKeyPrefix: string;

  constructor(localStorageKeyPrefix: string) {
    this.localStorageKeyPrefix = localStorageKeyPrefix;
  }

  public load(uuid = ""): DataType | undefined {
    let data: DataType | undefined;
    const stringifiedData = window.localStorage.getItem(this.localStorageKeyPrefix + uuid);
    if (stringifiedData) {
      try {
        data = JSON.parse(stringifiedData);
        // tslint:disable-next-line:no-empty
      } catch (e) {
      }
    }
    return data;
  }

  public save(data: DataType, uuid = "") {
    window.localStorage.setItem(this.localStorageKeyPrefix + uuid, JSON.stringify(data));
  }
}
