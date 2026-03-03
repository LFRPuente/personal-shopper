1. En home, tiene qué haber una interacción entre el AV y PS 
Cuando el AV mande una notificación sobre el cliente, al PS le tiene qué aparecer parpadeando
Estas notificaciones se activan cuando el AV:
    - El cliente pide que se revise un producto ya sea de la talla tamaño o existencia
    - Abajo de cada producto tiene qué haber una nota del AV de revisión de ese producto y ese producto tiene qué aparecer primero y parpadear
    - EL PS tiene qué confirmar que el producto hay en existencia o puede enviar alternativas así como fotos adjuntas de Estas
    - Al final se escoge una alternativa y esta reemplaza al producto original o se queda con el producto original o se descarta y no queda en el listado de productos para el cliente

2. Agregar copiar fotos o foto al hacer click sobre esta para el PS y AV.

3. En la ventana home, agregar una pequeña sección de interacción entre el AV y el PS que sea un listado de peticiones que cada elemento tenga los siguientes botones:
    - Enterado
    - No existencia
    - Descartar
    - modificar
Tanto AV como PS pueden agregar y modificar estas peticiones se modifican en tiempo real para ambos usuarios, tiene qué tener un scroll invisible para que no se ocupe mucho espacio y se ajuste a la pantalla 

4. El menú de home, missions, clientes, prodile tiene qué estar fijo en la pantalla y el contenido de cada sección tiene qué estar desplazado.

5. Se tiene qué agregar una nueva vista que se llame calculadora, Dentro de la calculadora tienes qué escoger si es por factor o por porcentaje, el defauilt tiene qué ser el factor, este tiene qué tneer una constante por default el último factor colocado por el usuario, esta calculadora funciona de la siguiente manera:
    - El usuario ingresa un precio y es multiplicado por el factor y el resultado que da simplemente se puede copiar al dar click sobre el número.
La calculadora de porcentaje tiene tres constantes taxes (tx), comisión (%) y tipo de cambio (tc), se ingresa el monto y se multiplica porcentaje, tx y tc y el resultado que da simplemente se puede copiar al dar click sobre el número.

6. Dentro de la pestaña de productos por client, se tienen qué realizar los siguientes puntos:
    - Optimizar espacio de imágenes para que quepan más productos en la pantalla
    - Tiene qué aparecer toda la imagen en la miniatura aunque esté pequeña
    - Tiene qué aparecer la fecha de la misión
    - Tiene qué aparecer un contador de productos por estatus un group by por el status sin contar el de enviado
    - En lugar de tener dos ventanas de product y ticket, que hayan dos ventanas status y revisión, de acuerdo a los status de los productos, primero se colocar revisión y luego anotado, por ahora no debería estar la de tickets
    - Debe habber un nuevo botón para visualizar la imagen en tamaño completo
    - Dentro de Edit Product Info pop up se tienen qué modificar las siguientes características:
        - Real Store Price - > Store Price (USD)
        - Charged Price (PS) -> Final Price (MXN)
        - Tags (e.g. Talla:M, Hombre, Nike) ponlo como un listado no solo separado por comas donde se puedan añadir nuevos entries
        - Final Price (MXN) no es un entry del usuario este se actualiza de acuerdo a un factor o a la lógica de porcentaje Igual que en la lógica de la calculadora, hay qué colocar estos valores en Edit Product Info pop up como nuevos campos de acuerdo a si se escoja factor o porcentaje. 
        - Agregar dropbox para seleccionar la tienda con un pqeuño buscador, el AV puede agregar tiendas nuevas. Esto se tiene qué agregar en los modelos del back para que esté relacionado con el producto.
        - Cambiar los botónes del dropbox del status a: 
            - Anotado
            - En Revisión
            - Enviado

7. En la ventana de mission al terminar una misión, en la lista de clientes agregar un botón que deje copiar el desglose para elcliente en esa misión el desglose incluye el final price (MXN) por producto de la siguiente manera:
        DESGLOSE DE TU CUENTA:

        * Mochila blanca Guess – $1,350
        * Bolsa Guess Grande – $1,350
        * Bolsa blanca Guess – $1,140
        * Bolsa Guess Rosa  – $1,290
        * Bolsa Guess Menta – $1,140
        * Bolsa Aldo Blanca – $690
        * Cartera Timberland – $390
        * Cartera Perry Ellis – $390


        TOTAL TIENDA: $7,740

        Para poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗

Una vez copiado el desglose cambia de color de la caja del cliente para indicar que ya se copio el desglose.

De igual manera se puede generar un csv con el desglose de todos los clientes en un botón en mission. Al terminar una misión el cliente ya no tiene qué aparecer activo en la ventana clients para la siguiente misión.  

8. Apartado de envíos (TBD)

9. Reportes