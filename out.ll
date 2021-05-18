; ModuleID = 'demo'
source_filename = "demo"

@0 = private unnamed_addr constant [13 x i8] c"hello world\0A\00", align 1

define i32 @main() {
entry:
  %0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @0, i32 0, i32 0))
  ret i32 0
}

declare i32 @printf(i8*, ...)
