// If you have configured ES module or TypeScript, you can replace the next line with `import llvm from 'llvm-bindings';`
import llvm from "llvm-bindings";

const context = new llvm.LLVMContext();
const mod = new llvm.Module("demo", context);
const builder = new llvm.IRBuilder(context);

const mainFunc = llvm.Function.Create(
  llvm.FunctionType.get(builder.getInt32Ty(), [], false),
  llvm.Function.LinkageTypes.ExternalLinkage,
  "main",
  mod
);
const printfFunc = llvm.Function.Create(
  llvm.FunctionType.get(builder.getInt32Ty(), [builder.getInt8PtrTy()], true),
  llvm.Function.LinkageTypes.ExternalLinkage,
  "printf",
  mod
);
const mainFuncEntry = llvm.BasicBlock.Create(context, "entry", mainFunc);
builder.SetInsertionPoint(mainFuncEntry);

builder.CreateCall(printfFunc, [builder.CreateGlobalStringPtr("hello world\n")]);

builder.CreateRet(builder.getInt32(0));
console.log(llvm.verifyModule(mod));
if (!llvm.verifyFunction(mainFunc) && !llvm.verifyModule(mod)) {
  mod.print("out.ll");
}
