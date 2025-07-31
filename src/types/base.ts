export type RecursiveArray<T> = ReadonlyArray<T | RecursiveArray<T>>;

export type RecursiveReadonlyArray<T> = ReadonlyArray<T | RecursiveReadonlyArray<T>>;

export type Awaitable<Value> = PromiseLike<Value> | Value;
export type NonAbstract<Type extends abstract new (...args: any) => any> = Type extends abstract new (
	...args: infer Args
) => infer Instance
	? Pick<Type, keyof Type> & (new (...args: Args) => Instance)
	: never;
export type EnumLike<Enum, Value> = Record<keyof Enum, Value>;
export type RafeConfig = {
	pluginsLoaded: boolean;
};
