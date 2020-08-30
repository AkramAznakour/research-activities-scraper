const { performance } = require("perf_hooks");

const performanceWrapping = (jobFunction) => async ({ ...args }) => {
  if (
    !process.env.PERFORMANCE_WRAPPING ||
    process.env.PERFORMANCE_WRAPPING == "false"
  )
    return await jobFunction(args);

  const t0 = performance.now();
  const result = await jobFunction(args);
  const t1 = performance.now();

  console.log("calling :", jobFunction.name);
  console.log("args :", args);
  console.log("took :", parseInt(t1 - t0), "ms \n");

  const used = process.memoryUsage();
  for (let key in used)
    console.log(
      `Memory: ${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
    );

  console.log("------------------------------------");

  return result;
};

exports.performanceWrapping = performanceWrapping;
