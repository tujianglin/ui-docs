import vueJsxVapor from 'vue-jsx-vapor/volar';

export default {
  plugins: [
    vueJsxVapor({
      macros: true,
      interop: true,
      sourceMap: true,
    }),
  ],
};
