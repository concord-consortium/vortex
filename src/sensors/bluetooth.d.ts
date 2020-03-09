// NOTE: this was not working when running from node_modiles/@types so it was
// saved locally

// Type definitions for Web Bluetooth
// Project: https://webbluetoothcg.github.io/web-bluetooth/
// Definitions by: Uri Shaked <https://github.com/urish>
//                 Xavier Lozinguez <http://github.com/xlozinguez>
//                 Rob Moran <https://github.com/thegecko>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped


// this is an extension to the BLE interface to allow for search for devices
interface IConnectDevice {
	id: string;
	name: string;
	uuids: string;
	adData: {
		rssi: number;
		txPower: number;
		serviceData: any;
		manufacturerData: any;
	};
}
type SelectDeviceFn = (device: IConnectDevice) => void;
type CancelDeviceFn = () => void;
interface IOnDevicesFoundResult {
	devices: IConnectDevice[];
	select: SelectDeviceFn;
	cancel: CancelDeviceFn;
}
type OnDevicesFoundFn = (results: IOnDevicesFoundResult) => void;

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;
type BluetoothDescriptorUUID = number | string;

// tslint:disable-next-line:interface-name
interface BluetoothRequestDeviceFilter {
	services?: BluetoothServiceUUID[];
	name?: string;
	namePrefix?: string;
	manufacturerId?: number;
	serviceDataUUID?: BluetoothServiceUUID;
}

type RequestDeviceOptions = {
	filters: BluetoothRequestDeviceFilter[];
	optionalServices?: BluetoothServiceUUID[];
	onDevicesFound?: OnDevicesFoundFn;
	scanTime?: number;
	deviceTimeout?: number;
} | {
	acceptAllDevices: boolean;
	optionalServices?: BluetoothServiceUUID[];
	scanTime?: number;
	deviceTimeout?: number;
};

// tslint:disable-next-line:interface-name
interface BluetoothRemoteGATTDescriptor {
	readonly characteristic: BluetoothRemoteGATTCharacteristic;
	readonly uuid: string;
	readonly value?: DataView;
	readValue(): Promise<DataView>;
	writeValue(value: BufferSource): Promise<void>;
}

// tslint:disable-next-line:interface-name
interface BluetoothCharacteristicProperties {
	readonly broadcast: boolean;
	readonly read: boolean;
	readonly writeWithoutResponse: boolean;
	readonly write: boolean;
	readonly notify: boolean;
	readonly indicate: boolean;
	readonly authenticatedSignedWrites: boolean;
	readonly reliableWrite: boolean;
	readonly writableAuxiliaries: boolean;
}

// tslint:disable-next-line:interface-name
interface CharacteristicEventHandlers {
	oncharacteristicvaluechanged: (this: this, ev: Event) => any;
}

// tslint:disable-next-line:interface-name
interface BluetoothRemoteGATTCharacteristic extends EventTarget, CharacteristicEventHandlers {
	readonly service?: BluetoothRemoteGATTService;
	readonly uuid: string;
	readonly properties: BluetoothCharacteristicProperties;
	readonly value?: DataView;
	getDescriptor(descriptor: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor>;
	getDescriptors(descriptor?: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor[]>;
	readValue(): Promise<DataView>;
	writeValue(value: BufferSource): Promise<void>;
	startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
	stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
	addEventListener(type: "characteristicvaluechanged", listener: (this: this, ev: Event) => any, useCapture?: boolean): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

// tslint:disable-next-line:interface-name
interface ServiceEventHandlers {
	onserviceadded: (this: this, ev: Event) => any;
	onservicechanged: (this: this, ev: Event) => any;
	onserviceremoved: (this: this, ev: Event) => any;
}

// tslint:disable-next-line:interface-name
interface BluetoothRemoteGATTService extends EventTarget, CharacteristicEventHandlers, ServiceEventHandlers {
	readonly device: BluetoothDevice;
	readonly uuid: string;
	readonly isPrimary: boolean;
	getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
	getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
	getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
	getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
	addEventListener(type: "serviceadded" | "servicechanged" | "serviceremoved", listener: (this: this, ev: Event) => any, useCapture?: boolean): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

// tslint:disable-next-line:interface-name
interface BluetoothRemoteGATTServer {
	readonly device: BluetoothDevice;
	readonly connected: boolean;
	connect(): Promise<BluetoothRemoteGATTServer>;
	disconnect(): void;
	getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
	getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

// tslint:disable-next-line:interface-name
interface BluetoothDeviceEventHandlers {
	onadvertisementreceived: (this: this, ev: Event) => any;
	ongattserverdisconnected: (this: this, ev: Event) => any;
}

// tslint:disable-next-line:interface-name
interface BluetoothDevice extends EventTarget, BluetoothDeviceEventHandlers, CharacteristicEventHandlers, ServiceEventHandlers {
	readonly id: string;
	readonly name?: string;
	readonly gatt?: BluetoothRemoteGATTServer;
	readonly uuids?: string[];
	watchAdvertisements(): Promise<void>;
	unwatchAdvertisements(): void;
	readonly watchingAdvertisements: boolean;
	addEventListener(type: "gattserverdisconnected" | "advertisementreceived", listener: (this: this, ev: Event) => any, useCapture?: boolean): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

// tslint:disable-next-line:interface-name
interface Bluetooth extends EventTarget, BluetoothDeviceEventHandlers, CharacteristicEventHandlers, ServiceEventHandlers {
	getAvailability(): Promise<boolean>;
	onavailabilitychanged: (this: this, ev: Event) => any;
	readonly referringDevice?: BluetoothDevice;
	requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
	addEventListener(type: "availabilitychanged", listener: (this: this, ev: Event) => any, useCapture?: boolean): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}
