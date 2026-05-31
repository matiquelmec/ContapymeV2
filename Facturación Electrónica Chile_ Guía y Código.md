# **Arquitectura e Implementación de Facturación Electrónica en Chile (SII): Guía Exhaustiva y Código de Integración**

La integración profunda de un sistema contable o de Planificación de Recursos Empresariales (ERP) con los servicios del Servicio de Impuestos Internos (SII) de Chile constituye uno de los desafíos arquitectónicos, criptográficos y operativos más complejos dentro de los regímenes tributarios de América Latina. Desde la masificación progresiva que culminó con la obligatoriedad de la facturación electrónica incluso para microempresas ubicadas en sectores rurales a partir de febrero de 2018, el ecosistema transaccional chileno exige una precisión algorítmica absoluta.1 El Documento Tributario Electrónico (DTE) no es un simple comprobante digital, sino una estructura de datos codificada en XML que encapsula la información comercial y fiscal, resguardada por múltiples capas de firmas digitales y protocolos de transmisión que exigen un cumplimiento normativo irrestricto.2  
El presente reporte expone una investigación y análisis exhaustivo sobre los componentes tecnológicos, los flujos operativos asíncronos, las exigencias criptográficas y las estrategias de código necesarias para dotar a un software contable de la capacidad nativa de emitir, firmar, enviar y trazar facturas electrónicas en la jurisdicción chilena.

## **Arquitectura de Entornos y Requisitos Habilitantes**

El ecosistema tecnológico del SII provee dos infraestructuras tecnológicas paralelas, diseñadas para separar estrictamente el tráfico de pruebas del tráfico fiscalmente vinculante. Esta separación garantiza que los desarrolladores de software puedan depurar sus sistemas contables sin alterar los libros mayores del estado.  
El primer entorno, denominado Ambiente de Certificación, es comúnmente conocido por el dominio de sus servidores web: maullin.sii.cl.4 Este ambiente actúa como un entorno de homologación o "sandbox". Aquí, los sistemas contables pueden ejecutar operaciones libremente, enviar documentos de prueba, forzar errores para probar la resiliencia del software y completar el proceso de certificación obligatorio.5 El segundo entorno es el Ambiente de Producción, alojado bajo el dominio palena.sii.cl.4 Las peticiones que alcanzan los servidores de Palena generan obligaciones tributarias reales, afectan el registro de compras y ventas, y exigen el uso de folios comerciales auténticos.  
Para que un sistema interactúe con cualquiera de estos ambientes, la arquitectura de la solución debe incorporar la gestión segura de un Certificado Digital (Firma Electrónica).6 Este certificado, generalmente distribuido en formatos PKCS\#12 (archivos con extensión .pfx o .p12), debe ser emitido por una entidad certificadora acreditada por el gobierno chileno.4 El certificado está indisolublemente ligado al Rol Único Tributario (RUT) de una persona natural, la cual debe estar explícitamente registrada ante el SII como representante legal de la empresa emisora o como un usuario autorizado para operar en su nombre.1 La inscripción administrativa de la empresa en el sistema de facturación electrónica propio o de mercado requiere que no existan situaciones tributarias pendientes.1

## **El Proceso de Certificación de Software Contable**

Cuando una organización desarrolla un sistema contable propietario o localiza un ERP de clase mundial (como SAP, Odoo o Microsoft Dynamics), el software debe superar un riguroso proceso de certificación en el ambiente de Maullín. Este proceso es auditable y tiene como objetivo asegurar que el motor de generación de XML del software construye los documentos correctamente, aplica las firmas criptográficas sin corromper la canonicalización, y se comunica de manera resiliente con los Web Services del SII.  
El esquema de certificación contempla una secuencia de pruebas y declaraciones que el sistema contable debe procesar en orden.5 A continuación, se detallan las etapas y sus implicancias técnicas para la arquitectura del sistema:

| Etapa de Certificación | Descripción Operativa | Implicancia Técnica para el Sistema Contable |
| :---- | :---- | :---- |
| **Set de Pruebas asignado por el SII** | Recepción de un conjunto de casos de prueba únicos (ej. Caso 86424-2) con datos base proporcionados por el SII.8 | El motor del ERP debe ingerir un archivo de especificaciones, calcular montos netos, exentos e IVA, y generar lotes de facturas, guías y notas.10 |
| **Set de Simulación** | Ejecución de operaciones comerciales simuladas de inicio a fin. | El software debe demostrar manejo de referencias cruzadas (ej. una Nota de Crédito que anula o modifica un folio de Factura previo).5 |
| **Intercambio de Información** | Prueba de interoperabilidad B2B entre contribuyentes.5 | Implementación de módulos de recepción y validación de XML externos, generando y enviando acuses de recibo comerciales. |
| **Envío de Muestras de Impresión** | Generación de hasta 20 representaciones visuales (PDF) de los documentos.5 | El motor de renderizado debe incrustar el timbre electrónico (código de barras PDF417) en base al estándar visual exigido.12 |
| **Declaración de Cumplimiento** | Trámite administrativo formalizado por el Representante Legal.5 | El sistema debe haber persistido los folios y Track IDs exitosos para fundamentar esta declaración en el portal del SII.13 |
| **Registro como Emisor Electrónico** | Resolución formal que autoriza el paso a Producción (Palena).5 | Cambio de variables de entorno en el ERP: apuntar URIs de maullin a palena y cargar el archivo de folios reales.4 |

Un requerimiento arquitectónico crítico durante esta fase es la política de depuración de inactividad. El SII purgará del ambiente de certificación a cualquier contribuyente postulante que no registre actividad en los sistemas durante un lapso consecutivo de seis meses.5 Esta restricción obliga a los equipos de desarrollo a mantener flujos de integración continua (CI/CD) que envíen documentos periódicamente si el proceso de desarrollo del ERP toma más tiempo del estimado.

## **Autenticación y Gestión de Sesiones mediante Protocolo SOAP**

La comunicación máquina a máquina con el SII no utiliza esquemas modernos como OAuth2 o API Keys estáticas. La arquitectura del SII es *stateful* y se basa en el intercambio dinámico de desafíos mediante el protocolo SOAP. El flujo de autenticación, operado por los servicios CrSeed y GetTokenFromSeed, exige un proceso de tres pasos donde el sistema contable debe demostrar control sobre el Certificado Digital.4

### **Dinámica del Desafío y Respuesta Criptográfica**

El flujo comienza cuando el sistema contable envía una petición HTTP POST al Web Service de creación de semilla (CrSeed.jws).4 Este endpoint, accesible en https://maullin.sii.cl/DTEWS/CrSeed.jws?WSDL o su equivalente en Palena, devuelve un documento XML que contiene un número aleatorio denominado Semilla.15 Este número único es generado por los servidores del estado y sirve como identificador de sesión efímero, otorgando al sistema contable una ventana de tiempo de exactamente dos minutos para responder al desafío.4  
Una vez obtenida la Semilla, el sistema contable debe integrarla dentro de una plantilla XML específica (el nodo \<getToken\>) y aplicar una firma digital avanzada (XML-DSIG) sobre dicho documento.15 La firma se computa utilizando la clave privada alojada en el archivo PKCS\#12 del usuario autorizado. Este paso asegura la identidad del emisor y garantiza la no repudiación de la solicitud. Finalmente, el documento XML firmado se inyecta en el cuerpo de una segunda petición SOAP dirigida al endpoint GetTokenFromSeed.jws.14 Si la validación criptográfica en los servidores del SII es exitosa, la respuesta contendrá un elemento \<TOKEN\> alfanumérico.4 Este token autoriza al ERP a consumir el resto de los servicios de la plataforma, operando típicamente como una cookie o encabezado HTTP en las transacciones subsecuentes.19

### **Implementación Práctica del Motor de Autenticación**

Para materializar este flujo en un sistema contable moderno, el código requiere una orquestación precisa entre librerías de solicitudes HTTP y motores de seguridad XML. El siguiente bloque de código implementa esta arquitectura en Python, basándose en la librería C subyacente xmlsec para garantizar el cumplimiento de los estándares W3C.15

Python  
import xml.etree.ElementTree as ET  
import requests  
from lxml import etree  
import xmlsec

class SIIAuthenticator:  
    """Motor de autenticación SOAP para integración con el SII."""  
      
    def \_\_init\_\_(self, cert\_path, cert\_password, is\_production=False):  
        self.base\_domain \= "palena.sii.cl" if is\_production else "maullin.sii.cl"  
        self.cert\_path \= cert\_path  
        self.cert\_password \= cert\_password

    def get\_seed(self):  
        """Solicita el número aleatorio (Semilla) al servidor."""  
        url \= f"https://{self.base\_domain}/DTEWS/CrSeed.jws"  
        soap\_envelope \= """\<?xml version="1.0" encoding="UTF-8"?\>  
        \<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"   
            xmlns:xsd="http://www.w3.org/2001/XMLSchema"   
            xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"   
            xmlns:def="http://DefaultNamespace"\>  
            \<soapenv:Header/\>  
            \<soapenv:Body\>  
                \<def:getSeed soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"/\>  
            \</soapenv:Body\>  
        \</soapenv:Envelope\>"""  
          
        headers \= {'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': ''}  
        response \= requests.post(url, data=soap\_envelope, headers=headers)  
          
        \# Extracción del valor de la Semilla del response SOAP  
        root \= ET.fromstring(response.text)  
        seed\_node \= root.find('.//Semilla')  
        if seed\_node is None:  
            raise Exception("No se pudo obtener la Semilla del SII.")  
        return seed\_node.text

    def sign\_seed(self, seed):  
        """Firma el documento XML de la semilla utilizando XML-DSIG."""  
        xml\_template \= f"\<getToken\>\<item\>\<Semilla\>{seed}\</Semilla\>\</item\>\</getToken\>"  
          
        xmlsec.init()  
        xmlsec.cryptoAppInit(None)  
        xmlsec.cryptoInit()  
          
        doc \= etree.fromstring(xml\_template.encode('utf-8'))  
        signature\_node \= xmlsec.template.create(  
            doc,  
            xmlsec.Transform.EXCL\_C14N,  
            xmlsec.Transform.RSA\_SHA1  
        )  
        doc.append(signature\_node)  
          
        ref \= xmlsec.template.add\_reference(signature\_node, xmlsec.Transform.SHA1)  
        xmlsec.template.add\_transform(ref, xmlsec.Transform.ENVELOPED)  
          
        key \= xmlsec.key.factory.Key.from\_memory(  
            open(self.cert\_path, 'rb').read(),  
            xmlsec.key.format.PKCS12,  
            password=self.cert\_password  
        )  
          
        ctx \= xmlsec.SignatureContext()  
        ctx.key \= key  
        ctx.sign(signature\_node)  
          
        return etree.tostring(doc, encoding='utf-8').decode('utf-8')

    def get\_token(self, signed\_seed\_xml):  
        """Intercambia la semilla firmada por el Token de autorización."""  
        url \= f"https://{self.base\_domain}/DTEWS/GetTokenFromSeed.jws"  
        soap\_envelope \= f"""\<?xml version="1.0" encoding="UTF-8"?\>  
        \<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"   
            xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"   
            xmlns:def="http://DefaultNamespace"\>  
            \<soapenv:Header/\>  
            \<soapenv:Body\>  
                \<def:getToken\>  
                    \<pszXml\>\<\!\]\>\</pszXml\>  
                \</def:getToken\>  
            \</soapenv:Body\>  
        \</soapenv:Envelope\>"""  
          
        headers \= {'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': ''}  
        response \= requests.post(url, data=soap\_envelope, headers=headers)  
          
        root \= ET.fromstring(response.text)  
        token\_node \= root.find('.//TOKEN')  
        if token\_node is None:  
            raise Exception("Validación fallida: " \+ response.text)  
        return token\_node.text

Dada la naturaleza temporal del token, una arquitectura de software robusta no debe invocar este proceso para cada factura que se emite. Se requiere un módulo gestor de sesiones o caché (como Redis) que almacene el token en memoria, lo inyecte en las operaciones subsecuentes, y lo renueve de forma proactiva únicamente cuando los servidores tributarios rechazan las peticiones (usualmente indicado por el error de estado igual a 10).20

## **Anatomía Estructural del Documento Tributario Electrónico (DTE)**

La base del sistema de facturación radica en la generación estructural y canónica del XML. El Documento Tributario Electrónico no se envía como un archivo aislado, sino que opera bajo una estructura de envoltura jerárquica obligatoria.21 Esta arquitectura de datos permite que un solo envío consolide múltiples transacciones, optimizando el ancho de banda y la carga de los servidores de recepción.  
La estructura general del documento de envío (denominado EnvioDTE para facturas y guías, o EnvioBOLETA para boletas electrónicas de ventas y servicios) se segmenta de la siguiente manera 21:

1. **Nodo Raíz (EnvioDTE):** Es el contenedor maestro. Declara los namespaces oficiales del SII y especifica el archivo de validación de esquemas (XSD).21  
2. **Nodo Agrupador (SetDTE):** Este elemento contiene un identificador único (ID) que será referenciado por la firma digital externa. Agrupa todos los componentes del lote.21  
3. **Encabezado del Lote (Caratula):** Este bloque contiene metadatos de alto nivel que describen el envío en su totalidad. Obligatoriamente incluye el RUT del emisor, el RUT de quien realiza el envío (que puede ser distinto si se usa un prestador de servicios), el RUT del receptor, y un sumario (SubTotDTE) que totaliza la cantidad de documentos incluidos, separados por tipo.21  
4. **Documentos Individuales (DTE):** Por cada transacción, se inserta un bloque \<DTE\> que encapsula el nodo \<Documento ID="..."\>. Es aquí donde el sistema contable plasma la lógica de negocios: los ítems vendidos, las tasas de impuesto, los recargos, descuentos globales y las referencias a documentos previos.21  
5. **Timbre Electrónico (TED):** Elemento criptográfico incrustado dentro de cada \<Documento\>. Su función es asegurar la inalterabilidad de los metadatos más críticos del documento, previniendo fraudes o alteraciones una vez emitido.21  
6. **Firmas Digitales (Signature):** Bloques que sellan criptográficamente distintas partes del árbol XML.21

La estricta dependencia de los identificadores (ID) dentro del XML exige que el ERP asigne cadenas únicas (típicamente UUIDs truncados o concatenaciones alfanuméricas del folio) a cada nodo que requiera ser firmado.

## **El Código de Autorización de Folios (CAF) y la Reconstrucción de Llaves RSA**

Ningún sistema contable tiene la potestad de autogenerar identificadores numéricos secuenciales para emitir facturas legales. El ciclo de vida de un DTE comienza forzosamente en el portal web del SII, desde donde el contribuyente solicita y descarga un archivo XML denominado Código de Autorización de Folios (CAF).3  
El archivo CAF cumple dos funciones críticas en la arquitectura del software:

1. **Delimitación de Inventario:** Establece el rango exacto de folios autorizados (por ejemplo, del folio 1000 al 2000\) para un tipo de documento específico (ejemplo, Tipo 33 para Factura Electrónica). El ERP debe leer estos rangos y gestionar internamente la asignación secuencial para evitar saltos o duplicidades.3  
2. **Provisión de Material Criptográfico:** Contiene una llave criptográfica RSA específica para ese lote de folios, junto con su contraparte pública. Esta llave es de tamaño reducido (tradicionalmente de 512 bits) y se utiliza exclusivamente para firmar el Timbre Electrónico de Documentos (TED) de las facturas que consuman folios de ese archivo.21

El análisis del nodo \<AUTORIZACION\> revela que la llave privada no se entrega en un formato estándar de la industria (como archivos .pem o .key), sino que el SII descompone los parámetros matemáticos del algoritmo RSA y los codifica en Base64 dentro del sub-nodo \<RSASK\>.21 Los parámetros expuestos típicamente incluyen el Módulo (\<Modulus\>), el Exponente (\<Exponent\>), los factores primos (\<P\>, \<Q\>), y los exponentes de descifrado (\<DP\>, \<DQ\>, \<InverseQ\>, \<D\>).24

### **La Matemática de la Reconstrucción del Archivo PEM**

Uno de los principales impedimentos para los ingenieros de software radica en que las bibliotecas criptográficas estándar (como OpenSSL) esperan ingerir una llave privada formateada en ASN.1 y codificada en PEM (Privacy-Enhanced Mail).26 Dado que el SII provee las constantes matemáticas en Base64, el código de integración debe implementar algoritmos de reconstrucción de llaves.  
La arquitectura del sistema no puede confiar en los tipos numéricos de punto flotante nativos de lenguajes como PHP o Python, ya que estos lenguajes utilizan precisión doble que no puede representar con exactitud los gigantescos enteros criptográficos de 512 o 1024 bits. Como evidencian las discusiones técnicas de la industria, tratar de operar estos números resulta en pérdida de precisión, requiriéndose bibliotecas de multiprecisión como bcmath o gmp en PHP, o el manejo automático de enteros largos de Python.28  
Sin embargo, el enfoque más eficiente utilizado por herramientas de ecosistema abierto es emplear un decodificador ASN.1 para ensamblar los componentes directamente en memoria y serializar la clave a formato PEM.26 El siguiente extracto ilustra la lógica matemática requerida para transponer el XML del CAF a una llave operativa en Python, utilizando la biblioteca de criptografía estándar:

Python  
import xml.etree.ElementTree as ET  
import base64  
from cryptography.hazmat.primitives.asymmetric import rsa  
from cryptography.hazmat.primitives import serialization  
from cryptography.hazmat.backends import default\_backend

def parse\_caf\_private\_key(caf\_xml\_path):  
    """Extrae los componentes RSA del archivo CAF y genera una llave PEM privada."""  
    tree \= ET.parse(caf\_xml\_path)  
    root \= tree.getroot()  
      
    \# Navegación hacia el nodo RSASK y extracción del Modulus y Exponentes  
    rsask\_node \= root.find('.//RSASK')  
    if rsask\_node is None:  
        raise ValueError("El archivo CAF no contiene una llave privada (RSASK).")  
      
    \# Función auxiliar para decodificar Base64 a enteros largos de Python  
    def b64\_to\_int(base64\_string):  
        decoded\_bytes \= base64.b64decode(base64\_string)  
        return int.from\_bytes(decoded\_bytes, byteorder='big')

    modulus \= b64\_to\_int(rsask\_node.find('Modulus').text)  
    public\_exponent \= b64\_to\_int(rsask\_node.find('Exponent').text)  
    private\_exponent \= b64\_to\_int(rsask\_node.find('D').text)  
    p \= b64\_to\_int(rsask\_node.find('P').text)  
    q \= b64\_to\_int(rsask\_node.find('Q').text)  
    dmp1 \= b64\_to\_int(rsask\_node.find('DP').text)  
    dmq1 \= b64\_to\_int(rsask\_node.find('DQ').text)  
    iqmp \= b64\_to\_int(rsask\_node.find('InverseQ').text)  
      
    \# Reconstrucción matemática de los números de la clave RSA  
    private\_numbers \= rsa.RSAPrivateNumbers(  
        p=p,  
        q=q,  
        d=private\_exponent,  
        dmp1=dmp1,  
        dmq1=dmq1,  
        iqmp=iqmp,  
        public\_numbers=rsa.RSAPublicNumbers(  
            e=public\_exponent,  
            n=modulus  
        )  
    )  
      
    \# Construcción del objeto llave  
    private\_key \= private\_numbers.private\_key(default\_backend())  
      
    \# Serialización de la llave al formato tradicional PEM  
    pem\_key \= private\_key.private\_bytes(  
        encoding=serialization.Encoding.PEM,  
        format\=serialization.PrivateFormat.TraditionalOpenSSL,  
        encryption\_algorithm=serialization.NoEncryption()  
    )  
      
    return pem\_key.decode('utf-8')

Esta lógica debe ejecutarse cada vez que un operador administrativo carga un nuevo archivo CAF al ERP. La llave PEM resultante debe ser almacenada de manera cifrada en la base de datos o en un sistema de gestión de claves empresariales (KMS) para ser consumida durante el proceso de emisión.29

## **El Triple Procedimiento de Firma Digital (XML-DSIG)**

La fricción de desarrollo más alta reportada por equipos de ingeniería radica en la topología de firmas anidadas. Un archivo finalizado de envío de facturas (EnvioDTE) no posee una única firma de validación. La norma exige que se ejecuten tres procedimientos de firma secuenciales e iterativos, operando estrictamente desde la entidad más pequeña hacia la envoltura más grande.21 Cualquier alteración de espacios en blanco, indentaciones (pretty-print) o conversión de finales de línea (CRLF a LF) posterior a la firma invalidará los resúmenes criptográficos (DigestValue), provocando el rechazo inmediato del documento en las puertas de enlace del estado.21

### **Paso 1: Firma del Timbre Electrónico (FRMT)**

El interior de cada bloque \<DTE\> resguarda un elemento \<TED\> (Transferencia Electrónica de Documentos). Este elemento agrupa un extracto de los datos del documento comercial (\<DD\>), el archivo CAF completo empotrado textualmente, y el valor de la firma (\<FRMT\>).21  
El procedimiento criptográfico para firmar el TED no sigue el estándar tradicional XML-DSIG. El algoritmo exigido es una aplicación estricta de SHA1withRSA sobre una cadena de texto aplanada.18

1. El motor del ERP extrae el elemento \<DD\> completo.  
2. Se procede a "aplanar" la estructura eliminando todos los caracteres de control espaciales: retornos de carro, saltos de línea y tabulaciones ubicadas entre las etiquetas XML.21 La cadena resultante debe comenzar inquebrantablemente con \<DD\> y concluir con \</DD\>.21  
3. Se deben escapar las entidades XML predefinidas (reemplazando caracteres como & por & y \< por \<) en los contenidos comerciales.21  
4. La cadena de texto aplanada debe codificarse forzosamente bajo el mapa de caracteres **ISO-8859-1 (Latin-1)**. Este requerimiento arquitectónico es fundamental, ya que obliga a representar caracteres de la lengua española (como la 'ñ' o vocales acentuadas) como un único valor binario de 8-bits, a diferencia de la longitud variable utilizada en UTF-8.21  
5. Sobre esta matriz de bytes ISO-8859-1 se computa el resumen hash SHA-1, y el resultado es cifrado matemáticamente utilizando la llave privada RSASK extraída previamente del archivo CAF correspondiente.21  
6. El vector cifrado se codifica en Base64 y se inyecta como texto plano dentro del nodo \<FRMT algoritmo="SHA1withRSA"\>.18

### **Paso 2: Firma Individual del Documento (XML-DSIG)**

Con el Timbre Electrónico cerrado y firmado, el ERP procede a firmar la totalidad de la transacción comercial. Este procedimiento sí emplea el estándar W3C para Firmas XML (XML-DSIG).21

* **Llave a utilizar:** Aquí se descarta la llave del CAF y se comienza a operar exclusivamente con la clave RSA privada (usualmente de 1024 o 2048 bits) alojada en el Certificado Digital X.509 del usuario autorizado.21  
* **Segmento a firmar:** La operación se enfoca exclusivamente en el bloque XML delimitado por \<Documento ID="..."\>.21  
* **Regla de Oro de la Canonicalización:** Las reglas del esquema chileno dictaminan que es crítico que ningún atributo de espacio de nombres (xmlns) esté presente en el documento individual cuando este se firma. El método de canonicalización debe ser obligatoriamente http://www.w3.org/TR/2001/REC-xml-c14n-20010315 (C14N exclusivo sin comentarios).21  
* **Inyección:** El nodo \<Signature\> generado se inserta al final del contenedor \<DTE\>, como hermano adyacente del nodo \<Documento\> recién firmado.

### **Paso 3: Firma del Contenedor de Envío (XML-DSIG)**

El paso final orquesta los múltiples documentos generados. El ERP acopla la \<Caratula\> y todos los bloques \<DTE\> ya firmados individualmente, englobándolos en el contenedor \<SetDTE ID="..."\>.21

* **Llave a utilizar:** El mismo Certificado Digital X.509 empleado en el Paso 2\.21  
* **Proceso:** El algoritmo de firma XML-DSIG se aplica sobre el nodo \<SetDTE\>, calculando un nuevo hash SHA-1 general. Este bloque \<Signature\> final y de gran tamaño se inyecta estratégicamente en la base del documento raíz \<EnvioDTE\>, justo antes del tag de cierre \</EnvioDTE\>.21

Una implementación de alto rendimiento para estos procesos evitará generar archivos físicos intermedios en disco duro. Los SDKs modernos gestionan estas mutaciones canónicas y operaciones criptográficas directamente en memoria (RAM), reduciendo drásticamente las latencias operativas.21

## **Transmisión HTTP Multipart y DTEUpload**

A diferencia de los servicios de consulta o autenticación que se nutren de una interfaz de programación de aplicaciones (API) basada en SOAP, la carga efectiva de los lotes de facturas a los servidores tributarios se realiza a través de una tecnología preexistente: un *Common Gateway Interface* (CGI).34 El servicio receptor, identificado como DTEUpload, rechaza peticiones JSON o XML puras, exigiendo de manera categórica que los envíos sigan el estándar HTTP POST codificado como multipart/form-data.34  
Este endpoint está ubicado en la ruta /cgi\_dte/UPL/DTEUpload bajo los dominios de certificación y producción respectivos.34 El desafío arquitectónico en esta capa reside en la confección manual del cuerpo de la solicitud (payload) y de sus encabezados, ya que librerías HTTP de alto nivel pueden alterar el encapsulamiento de los campos.

### **Estructura de la Petición y Autenticación de Envío**

Para que un archivo alcance exitosamente los balanceadores de carga del SII, el cliente HTTP del sistema contable debe suministrar un conjunto rígido de atributos en la cabecera, simulando ser un entorno compatible de cliente. Particularmente, la prueba de vida de la sesión (el Token previamente obtenido) no se transmite como un encabezado de Autorización (Authorization Bearer), sino que debe incrustarse textualmente como una Cookie de navegador bajo el formato Cookie: TOKEN={valor\_del\_token}.19  
Dentro del segmento de datos Multipart, el ERP debe separar los parámetros de identificación del emisor y enviar el documento firmado. La siguiente matriz de código ilustra la correcta configuración de un adaptador HTTP en Python, utilizando el módulo requests, para satisfacer estos imperativos técnicos.35

Python  
import requests

def upload\_signed\_dte(envio\_xml\_signed\_path, token, rut\_sender, rut\_company, is\_production=False):  
    """Sube el archivo XML del envío multipart al CGI del SII."""  
    domain \= "palena.sii.cl" if is\_production else "maullin.sii.cl"  
    url \= f"https://{domain}/cgi\_dte/UPL/DTEUpload"  
      
    \# Encabezados estrictos requeridos por la normativa   
    headers \= {  
        'Accept': 'image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, application/vnd.ms-powerpoint, application/ms-excel, application/msword, \*/\*',  
        'Accept-Language': 'es-cl',  
        'Accept-Encoding': 'gzip, deflate',  
        'User-Agent': 'Mozilla/4.0 (compatible; PROG 1.0; Windows NT 5.0; YComp 5.0.2.4)',   
        'Cookie': f'TOKEN={token}'  \# Autenticación delegada a la Cookie  
    }

    \# Descomposición del Rol Único Tributario y su Dígito Verificador (DV)  
    rut\_s, dv\_s \= rut\_sender.split('-')  
    rut\_c, dv\_c \= rut\_company.split('-')

    \# Diccionario estructurado para forzar la serialización multipart/form-data  
    \# El formato es 'nombre\_campo': (nombre\_archivo, contenido, content\_type)  
    multipart\_payload \= {  
        'rutSender': (None, rut\_s),  
        'dvSender': (None, dv\_s),  
        'rutCompany': (None, rut\_c),  
        'dvCompany': (None, dv\_c),  
        'archivo': ('envio.xml', open(envio\_xml\_signed\_path, 'rb'), 'text/xml')  
    }  
      
    \# Ejecución asíncrona de la petición  
    response \= requests.post(url, headers=headers, files=multipart\_payload)  
      
    if response.status\_code\!= 200:  
        raise ConnectionError(f"Error HTTP {response.status\_code} durante la subida.")  
          
    return response.text

Las políticas de gestión de red del SII exigen fraccionar archivos extraordinariamente grandes. Si un archivo de envío, especialmente cuando se procesan Libros Contables obligatorios, excede el límite de 8 Megabytes, la especificación normativa fuerza a los sistemas a dividir el archivo matriz en partes más pequeñas.19 Al aplicar esta división, el ERP debe ajustar variables adicionales de conteo de partes (Part y Parts) que se inyectan en los campos de formulario, permitiendo que la entidad reconstruya el lote.19  
Una subida técnica y criptográficamente correcta concluirá con el servidor tributario devolviendo un código HTTP 200 OK y un documento HTML en texto plano.19 El ERP no ha terminado su flujo aquí; debe escudriñar (mediante expresiones regulares) este cuerpo de texto para extraer un número único crucial denominado Identificador o "Track ID".19 Este número debe almacenarse indisolublemente ligado a la factura en las tablas relacionales del sistema, ya que será la única clave de búsqueda válida para rastrear la validez del documento en el futuro.

## **Trazabilidad, Polling Asíncrono y Web Services de Consulta**

La adjudicación de un Track ID significa que la petición multipart sorteó las compuertas perimetrales del estado, pero bajo ninguna métrica garantiza que la factura posee validez tributaria. Los servidores centrales del SII colocan el archivo XML en colas de mensajería (Message Brokers) para ejecutar un procesamiento asíncrono profundo. En esta etapa, algoritmos automáticos validan el esquema XSD de cada factura, recalculan la cuadratura impositiva renglón por renglón, verifican que las firmas no hayan sido alteradas y auditan la matriz para detectar el uso de folios duplicados o caducados.  
El sistema de facturación debe implementar rutinas en segundo plano (como *Cron Jobs* o *Workers*) encargadas de interrogar a la institución para conocer el destino final de las facturas.18

### **Políticas de Latencia Obligatoria (Backoff Rules)**

La orquestación de estos microservicios de actualización de estados (*Pollers*) no debe configurarse de manera agresiva. El manual técnico establece directrices de retardo que el software debe cumplir para evitar que las direcciones IP de la empresa emisora sufran un bloqueo por negación de servicio distribuida (DDoS) 39:

* Para lotes y archivos de un peso inferior a 30 KB, el trabajador asíncrono del ERP debe congelar la operación y esperar un margen íntegro de 2 minutos contados desde el instante del envío antes de despachar la primera consulta de estado.39  
* Para paquetes cuyo tamaño iguale o exceda los 30 KB, la latencia obligatoria se triplica, debiendo demorarse la comprobación por 6 minutos tras el envío.39

### **Consumo de Servicios SOAP para Trazabilidad**

Existen dos interfaces WSDL independientes, proporcionadas por el ecosistema de consulta, orientadas a auditar dimensiones distintas del proceso.40  
**A. Validación a Nivel de Paquete (QueryEstUp.jws)**  
Este Web Service responde el estado holístico del lote completo (\<EnvioDTE\>). Su invocación, a través del método getEstUp, requiere proporcionar el RUT del usuario consultante, el token de sesión vigente, y el Track ID previamente persistido.18 La decodificación de las respuestas, dictadas por los elementos \<ESTADO\> y \<ERR\_CODE\>, determina el accionar del ERP:

* **Estado EPR (En Proceso):** Indica que las colas de validación presentan alta latencia. La orden lógica para el ERP es re-encolar el Track ID para una evaluación en la próxima ventana programada.18  
* **Estado Aceptado (o Aceptado con Reparos):** Convalida que la estructura base es correcta y que los folios fueron integrados a las bases de datos gubernamentales.  
* **Estado RCH (Rechazado):** Evidencia fallas estructurales terminales o adulteración criptográfica. El ERP debe marcar los folios locales como anulados y notificar a las capas de negocio.18  
* **Estado \-11:** Este código especial dicta que existe una anomalía técnica de enrutamiento o una inconsistencia mayor en la carátula principal del documento, a menudo invitando a un reintento a corto plazo.18

**B. Validación a Nivel de Documento (QueryEstDte.jws)**  
Para escenarios comerciales B2B o resoluciones de conflicto, es vital verificar la situación de una factura o guía individual que haya llegado al ERP provista por un proveedor. El servicio QueryEstDte con su método getEstDte asume esta tarea, demandando una matriz exhaustiva de parámetros de entrada: RUT y Dígito Verificador del Consultante, de la Compañía Emisora, y del Receptor; sumados al Tipo de DTE, el número de Folio preciso, la Fecha de Emisión transaccional, el Monto total del Documento y un Token válido.43 Esta operación es fundamental dentro del componente de Cuentas por Pagar del ERP, ya que certificar este estado valida legalmente el aprovechamiento del Crédito Fiscal aplicable sobre el Impuesto al Valor Agregado (IVA).

## **Representación Visual e Impresión (Timbre PDF417)**

Pese a la inherente naturaleza digital de la norma, la ley dictamina que toda transacción que involucre el transporte físico de mercaderías o una entrega a un consumidor final no capacitado tecnológicamente, obliga al sistema a generar una representación impresa (Típicamente en formato PDF Carta u Oficio, o en rollos de impresión térmica de 80 milímetros).2  
La validez probatoria del documento impreso reposa sobre un código de barras bidimensional estandarizado internacionalmente: el PDF417. La carga informática (payload) inyectada dentro de este gráfico es la transcripción íntegra del archivo XML anidado en el nodo \<TED\> (después del aplanamiento sin espacios).8  
La algoritmia y formateo de la vista de impresión en el ERP obedece a un conjunto métrico y tipográfico estricto:

* **Localización Geométrica:** El timbre PDF417 debe ser renderizado invariablemente en la franja inferior del plano del documento, posicionado a una distancia mínima de salvaguarda de 2 centímetros de margen desde el borde izquierdo del papel.12  
* **Dimensionamiento:** Para preservar la legibilidad óptica de los lectores láser y de cámara, el bloque impreso debe sostener un área mínima de 2 por 5 centímetros, expandible hasta un techo máximo de 4 por 9 centímetros, dependiendo de la densidad de datos requerida.12  
* **Acuse Legal de Recibo:** La distribución de copias transaccionales (conocidas como "Copias Cedibles" que activan la capacidad de factoraje financiero) demanda la existencia de leyendas explícitas insertas en el documento impreso. Las Facturas (Electrónicas y Exentas) deben indicar de forma prominente el vocablo "CEDIBLE" acompañado de un recuadro de firma, mientras que para las Guías de Despacho la inscripción imperativa es "CEDIBLE CON SU FACTURA".12

Si un contribuyente archiva documentos impresos ante contingencias que imposibiliten la validación digital (por ejemplo, transacciones efectuadas con receptores manuales no autorizados), el archivo de los mismos durante un periodo base de seis años sirve como soporte auditable.2 No obstante, el sistema contable debe en todo momento salvaguardar íntegramente la versión XML validada subyacente para sortear procesos de fiscalización.2

## **Ecosistema de Código Abierto y Patrones de Arquitectura ERP**

Históricamente, integrar estas exigencias directamente en lenguajes de programación empresariales o motores de base de datos SQL requería una inversión monumental de miles de horas hombre de ingeniería, expuesta a fallos criptográficos que frenaban el despliegue del sistema.20 Frente a esta fricción tecnológica, los desarrolladores en Chile forjaron y maduraron un ecosistema robusto de herramientas de código abierto y kits de desarrollo de software (SDKs) que absorben la complejidad matemática del SII.

### **Ecosistema Histórico PHP: El Proyecto LibreDTE**

La biblioteca fundamental y pionera en el desarrollo independiente para la tributación chilena es LibreDTE.46 Escrito puramente en PHP, este framework desagrega la complejidad en módulos interconectados, siendo libredte-lib-core el núcleo donde habitan las rutinas de reconstrucción del archivo CAF y la validación matemática de clave pública del SII.47

* **Aportes Arquitectónicos:** Esta plataforma demostró a la comunidad cómo aislar el proceso de firma (el triple ciclo FRMT y DSIG) utilizando wrappers eficientes, solucionando problemas sistémicos como la canonicalización y la firma en ISO-8859-1.  
* **Integración Contemporánea:** Dada la escasez en manuales de instalación para arquitecturas monolíticas y dependencias históricas, la comunidad suele extraer fragmentos matemáticos del core o consumir su código bajo infraestructuras modularizadas en Docker o como librerías SDK llamadas asincrónicamente por el ERP.45

### **Vanguardia en Python y Aplicaciones Cloud**

Actualmente, el ecosistema de Python gobierna las implementaciones modernas, al ser el núcleo estructural de los módulos para el ERP global Odoo y múltiples frameworks basados en Django.50

* **Odoo y Localización Chilena:** El módulo l10n\_cl\_dte orquesta nativamente la conexión al SII.54 Este bloque arquitectónico refleja cómo los estados transaccionales deben almacenarse: el flujo de ventas o puntos de venta (POS) inyecta objetos contables al motor, y la interfaz persiste variables como la petición XML plana (sii\_xml\_request), el dictamen de validación de estado (sii\_result), y la serialización binaria en Base64 de la imagen renderizada del código de barras (sii\_barcode\_img).18 Esta aproximación elimina la dependencia de almacenamiento ineficiente en disco duro de los hosts web.  
* **Librerías Desacopladas:** Herramientas ampliamente mantenidas como cl-sii proveen la abstracción de bajo nivel en Python. Este SDK soluciona el análisis limpio y depurado de los árboles XML del DTE, facilitando de igual manera la implementación de operaciones secundarias avanzadas, como las escrituras técnicas en operaciones de "Cesión" de créditos fiscales.55 Adicionalmente, florecen repositorios satelitales (sii\_chile\_xml\_to\_pdf) abocados exclusivamente al problema de renderizar dinámicamente un comprobante fiscal en PDF partiendo puramente de un árbol de respuesta XML.50

### **Patrón Recomendado: Diseño Orientado a Microservicios (Minimal APIs)**

Al modelar un software contable que aspire al despliegue nativo en la nube (Cloud-Native), es una mala práctica acoplar el código de canonicalización XML y el transporte Multipart a las reglas de negocio base que calculan inventario o contabilidad de doble entrada. Las firmas del SII son altamente penalizadoras computacionalmente.  
La arquitectura de referencia emergente aboga por la abstracción del ecosistema tributario hacia una API independiente o Microservicio perimetral. Utilizando tecnologías escalables como Node.js con TypeScript 57, Minimal APIs de alto desempeño desarrolladas en.NET Core (como se observa en soluciones modernas que emplean Azure Blob Storage 29), o motores en FastAPI de Python, el ERP principal asume una postura pasiva. El ERP calcula el total de la transacción, empaca un JSON estandarizado con la información de la factura y lo remite al Microservicio.  
Este orquestador perimetral es el encargado directo de interactuar con bóvedas de seguridad (KMS) donde descansan los archivos CAF y los certificados digitales (pfx). Así, la API independiente realiza el volcado ISO-8859-1 de alta fricción, efectúa las iteraciones criptográficas de las etiquetas Signature 21, y maneja bajo su propia base de datos la cola asíncrona de peticiones HTTP POST Multipart (DTEUpload), descargando al núcleo contable de latencias extremas generadas por intermitencias en la red del SII.21 Esta delegación asimétrica asegura que el sistema contable sostenga altas tasas transaccionales operativas simultáneamente con el cumplimiento riguroso y transparente del entorno tributario chileno.

#### **Obras citadas**

1. Etapas para ser facturador electrónico \- SII | Servicio de Impuestos Internos, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/destacados/factura\_electronica/](https://www.sii.cl/destacados/factura_electronica/)  
2. Electronic Invoicing in Chile | How to issue DTE and comply with the SII \- EDICOM, fecha de acceso: mayo 29, 2026, [https://edicomgroup.com/blog/electronic-invoice-chile](https://edicomgroup.com/blog/electronic-invoice-chile)  
3. Electronic Invoicing and Transport Documents in Chile \- EDICOM, fecha de acceso: mayo 29, 2026, [https://edicomgroup.com/electronic-invoicing/chile](https://edicomgroup.com/electronic-invoicing/chile)  
4. jose / utilidades-sii-chile \- GitLab, fecha de acceso: mayo 29, 2026, [https://gitlab.com/osses/utilidades-sii](https://gitlab.com/osses/utilidades-sii)  
5. PROCESO DE CERTIFICACIÓN \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/factura\_mercado/proceso\_certificacion.htm](https://www.sii.cl/factura_electronica/factura_mercado/proceso_certificacion.htm)  
6. CERTIFICADO DIGITAL \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/certificado\_digital.htm](https://www.sii.cl/factura_electronica/certificado_digital.htm)  
7. PROCEDMIENTO DE POSTULACIÓN, CERTIFICACIÓN Y ... \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/factura\_mercado/proc\_postulacion.htm](https://www.sii.cl/factura_electronica/factura_mercado/proc_postulacion.htm)  
8. Requisitos y Condiciones para Contribuyentes emisores de Documentos Tributarios Electronicos \- SII, fecha de acceso: mayo 29, 2026, [https://maullin.sii.cl/cvc/dte/pe\_condiciones.html](https://maullin.sii.cl/cvc/dte/pe_condiciones.html)  
9. Archivo para certificar el set de pruebas DTE del SII utilizando Open DTE de niclab Chile \- GitHub Gist, fecha de acceso: mayo 29, 2026, [https://gist.github.com/EstebanFuentealba/e9fd215b557c06c2cd0b](https://gist.github.com/EstebanFuentealba/e9fd215b557c06c2cd0b)  
10. INSTRUCCIONES PARA LA CONSTRUCCIÓN DE DOCUMENTOS TRIBUTARIOS ELECTRÓNICOS CON LOS DATOS DEL SET DE PRUEBAS. INTRODUCCIÓN Este \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/servicios\_online/docs/inst\_set\_pruebas.pdf](https://www.sii.cl/servicios_online/docs/inst_set_pruebas.pdf)  
11. MANUAL PARA EMPRESAS USUARIAS \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/manual\_certificacion.pdf](https://www.sii.cl/factura_electronica/manual_certificacion.pdf)  
12. MANUAL DE MUESTRAS IMPRESAS \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/manual\_muestras\_impresas.pdf](https://www.sii.cl/factura_electronica/manual_muestras_impresas.pdf)  
13. INSTRUCTIVO PARA CERTIFICACIÓN BOLETAS ELECTRÓNICAS \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/guia\_emitir\_boleta\_servicio.htm](https://www.sii.cl/factura_electronica/guia_emitir_boleta_servicio.htm)  
14. Manual de Desarrollador \- Autenticación Automática \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/factura\_mercado/autenticacion.pdf](https://www.sii.cl/factura_electronica/factura_mercado/autenticacion.pdf)  
15. Autenticacion en Python \- Servicio de Impuestos Internos \- SII \- GitHub Gist, fecha de acceso: mayo 29, 2026, [https://gist.github.com/EstebanFuentealba/d8f2e60b2b2f1bac13ba](https://gist.github.com/EstebanFuentealba/d8f2e60b2b2f1bac13ba)  
16. https://maullin.sii.cl/DTEWS/CrSeed.jws?WSDL, fecha de acceso: mayo 29, 2026, [https://maullin.sii.cl/DTEWS/CrSeed.jws?WSDL](https://maullin.sii.cl/DTEWS/CrSeed.jws?WSDL)  
17. Swift palena.sii.cl getSeed SOAP Request \- Chilkat Examples, fecha de acceso: mayo 29, 2026, [http://example-code.com/swift/palena\_sii\_cl\_getSeed.asp](http://example-code.com/swift/palena_sii_cl_getSeed.asp)  
18. odoo-chile/l10n\_cl\_stock\_picking/models/point\_of\_sale.py at master \- GitHub, fecha de acceso: mayo 29, 2026, [https://github.com/intellego-bi/odoo-chile/blob/master/l10n\_cl\_stock\_picking/models/point\_of\_sale.py](https://github.com/intellego-bi/odoo-chile/blob/master/l10n_cl_stock_picking/models/point_of_sale.py)  
19. STEP BY STEP GUIDE TO SUBMIT DOCUMENTATION AND REQUEST ADVANCE PRICING ARRANGEMENTS \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/servicios\_online/docs/guia\_paso\_a\_paso\_apa\_eng.pdf](https://www.sii.cl/servicios_online/docs/guia_paso_a_paso_apa_eng.pdf)  
20. Software for sending DTES to the SII : r/chileIT \- Reddit, fecha de acceso: mayo 29, 2026, [https://www.reddit.com/r/chileIT/comments/1nptcrl/software\_env%C3%ADo\_dtes\_al\_sii/?tl=en](https://www.reddit.com/r/chileIT/comments/1nptcrl/software_env%C3%ADo_dtes_al_sii/?tl=en)  
21. XML-DSIG and the Chile SII \- Revisited 2020 \- CryptoSys.net, fecha de acceso: mayo 29, 2026, [https://cryptosys.net/pki/xmldsig-ChileSII.html](https://cryptosys.net/pki/xmldsig-ChileSII.html)  
22. INSTRUCTIVO TECNICO FACTURA ELECTRONICA \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/factura\_mercado/instructivo\_emision.pdf](https://www.sii.cl/factura_electronica/factura_mercado/instructivo_emision.pdf)  
23. Unicode C Create sii.cl Factura Electrónica (Chile Servicio de Impuestos Internos), fecha de acceso: mayo 29, 2026, [https://www.example-code.com/UnicodeC/sii\_cl\_factura\_electr%C3%B3nica.asp](https://www.example-code.com/UnicodeC/sii_cl_factura_electr%C3%B3nica.asp)  
24. Create RSA XML Key \- RSAKeyConverter, fecha de acceso: mayo 29, 2026, [https://raskeyconverter.azurewebsites.net/](https://raskeyconverter.azurewebsites.net/)  
25. How to load rsa keys from pem file and encrypt/decrypt string \- Chilkat Forum, fecha de acceso: mayo 29, 2026, [http://www.chilkatforum.com/questions/11628/how-to-load-rsa-keys-from-pem-file-and-encryptdecrypt-string](http://www.chilkatforum.com/questions/11628/how-to-load-rsa-keys-from-pem-file-and-encryptdecrypt-string)  
26. Generate .pem RSA public key file using base 10 modulus and exponent? \- Super User, fecha de acceso: mayo 29, 2026, [https://superuser.com/questions/1200612/generate-pem-rsa-public-key-file-using-base-10-modulus-and-exponent](https://superuser.com/questions/1200612/generate-pem-rsa-public-key-file-using-base-10-modulus-and-exponent)  
27. Reconstruct RSA public key from exponent and modulus | Calvin's Dev Logs, fecha de acceso: mayo 29, 2026, [https://calvin.my/posts/reconstruct-rsa-public-key-from-exponent-and-modulus](https://calvin.my/posts/reconstruct-rsa-public-key-from-exponent-and-modulus)  
28. Quicker way to calculate RSA private key in PHP \- Stack Overflow, fecha de acceso: mayo 29, 2026, [https://stackoverflow.com/questions/13388863/quicker-way-to-calculate-rsa-private-key-in-php](https://stackoverflow.com/questions/13388863/quicker-way-to-calculate-rsa-private-key-in-php)  
29. sergioocode/Sii.ObtenerTokenAuth: Solución en .NET para obtener un token de autorización del SII (Chile) mediante servicios SOAP. Incluye una Minimal API que firma digitalmente la semilla con un certificado .pfx almacenado en Azure Blob Storage y obtiene un token. · GitHub, fecha de acceso: mayo 29, 2026, [https://github.com/sergioocode/Sii.ObtenerTokenAuth](https://github.com/sergioocode/Sii.ObtenerTokenAuth)  
30. PEM\_read\_RSAPrivateKey: Getting RSA key public modulus and exponent \- Stack Overflow, fecha de acceso: mayo 29, 2026, [https://stackoverflow.com/questions/22349891/pem-read-rsaprivatekey-getting-rsa-key-public-modulus-and-exponent](https://stackoverflow.com/questions/22349891/pem-read-rsaprivatekey-getting-rsa-key-public-modulus-and-exponent)  
31. Convertir documentos del SII (Chile), de XML a PDF | by Antonio Cañada \- Medium, fecha de acceso: mayo 29, 2026, [https://antoniocanada.medium.com/convertir-documentos-del-sii-chile-de-xml-a-pdf-4edcd444959e](https://antoniocanada.medium.com/convertir-documentos-del-sii-chile-de-xml-a-pdf-4edcd444959e)  
32. PHP ActiveX SII Chile \- FRMT Signature Computation and Add to XML \- Chilkat Examples, fecha de acceso: mayo 29, 2026, [https://example-code.com/phpAx/sii\_cl\_frmt\_signature.asp](https://example-code.com/phpAx/sii_cl_frmt_signature.asp)  
33. XML-DSIG and the Chile SII \- CryptoSys.net, fecha de acceso: mayo 29, 2026, [https://cryptosys.net/pki/xmldsig-ChileSII-historical.html](https://cryptosys.net/pki/xmldsig-ChileSII-historical.html)  
34. Ejemplo de upload automático \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/factura\_mercado/ejem\_upload.txt](https://www.sii.cl/factura_electronica/factura_mercado/ejem_upload.txt)  
35. TIL: Howto create multipart form data in Python \- Tim Head, fecha de acceso: mayo 29, 2026, [https://betatim.github.io/posts/python-create-multipart-formdata/](https://betatim.github.io/posts/python-create-multipart-formdata/)  
36. How to send a "multipart/form-data" with requests in python? \- Stack Overflow, fecha de acceso: mayo 29, 2026, [https://stackoverflow.com/questions/12385179/how-to-send-a-multipart-form-data-with-requests-in-python](https://stackoverflow.com/questions/12385179/how-to-send-a-multipart-form-data-with-requests-in-python)  
37. How to Send "multipart/form-data" with Requests in Python \- Stack Abuse, fecha de acceso: mayo 29, 2026, [https://stackabuse.com/bytes/how-to-send-multipart-form-data-with-requests-in-python/](https://stackabuse.com/bytes/how-to-send-multipart-form-data-with-requests-in-python/)  
38. Python File Upload: Simulate POST request with multipart/Form-Data \- w3resource, fecha de acceso: mayo 29, 2026, [https://www.w3resource.com/python-exercises/urllib3/python-urllib3-exercise-19.php](https://www.w3resource.com/python-exercises/urllib3/python-urllib3-exercise-19.php)  
39. Servicio de Impuestos Internos \- Sii, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/sobre\_el\_sii/1941-4655.htm](https://www.sii.cl/sobre_el_sii/1941-4655.htm)  
40. https://maullin.sii.cl/DTEWS/services/QueryEstDteAv?wsdl, fecha de acceso: mayo 29, 2026, [https://maullin.sii.cl/DTEWS/services/QueryEstDteAv?wsdl](https://maullin.sii.cl/DTEWS/services/QueryEstDteAv?wsdl)  
41. And now... Some Services, fecha de acceso: mayo 29, 2026, [https://palena.sii.cl/DTEWS/QueryEstUp.jws](https://palena.sii.cl/DTEWS/QueryEstUp.jws)  
42. And now... Some Services, fecha de acceso: mayo 29, 2026, [https://maullin.sii.cl/DTEWS/QueryEstUp.jws](https://maullin.sii.cl/DTEWS/QueryEstUp.jws)  
43. Manual de Desarrollador Externo \- SII, fecha de acceso: mayo 29, 2026, [https://www.sii.cl/factura\_electronica/factura\_mercado/estado\_dte.pdf](https://www.sii.cl/factura_electronica/factura_mercado/estado_dte.pdf)  
44. FacTronica/TimbrePdf417: Generar Timbre Pdf417 \- GitHub, fecha de acceso: mayo 29, 2026, [https://github.com/FacTronica/TimbrePdf417](https://github.com/FacTronica/TimbrePdf417)  
45. LibreDTE community, has anyone been able to successfully install and configure it? \- Reddit, fecha de acceso: mayo 29, 2026, [https://www.reddit.com/r/chileIT/comments/1ln14d3/libredte\_comunidad\_alguien\_ha\_podido\_instalarlo\_y/?tl=en](https://www.reddit.com/r/chileIT/comments/1ln14d3/libredte_comunidad_alguien_ha_podido_instalarlo_y/?tl=en)  
46. GitHub \- PittacusW/libredte-lib: Biblioteca Estándar de LibreDTE en PHP, fecha de acceso: mayo 29, 2026, [https://github.com/PittacusW/libredte-lib](https://github.com/PittacusW/libredte-lib)  
47. LibreDTE \- GitHub, fecha de acceso: mayo 29, 2026, [https://github.com/libredte](https://github.com/libredte)  
48. LibreDTE/libredte-lib-core: LibreDTE: Biblioteca PHP (Núcleo) \- GitHub, fecha de acceso: mayo 29, 2026, [https://github.com/LibreDTE/libredte-lib-core](https://github.com/LibreDTE/libredte-lib-core)  
49. libredte · GitHub Topics, fecha de acceso: mayo 29, 2026, [https://github.com/topics/libredte](https://github.com/topics/libredte)  
50. factura-electronica · GitHub Topics, fecha de acceso: mayo 29, 2026, [https://github.com/topics/factura-electronica?l=python\&o=desc\&s=updated](https://github.com/topics/factura-electronica?l=python&o=desc&s=updated)  
51. l10n\_cl\_dte/models/invoice.py at 8.0 \- GitHub, fecha de acceso: mayo 29, 2026, [https://github.com/odoo-chile/l10n\_cl\_dte/blob/8.0/models/invoice.py](https://github.com/odoo-chile/l10n_cl_dte/blob/8.0/models/invoice.py)  
52. odoo-chile/l10n\_cl\_dte \- GitHub, fecha de acceso: mayo 29, 2026, [https://github.com/odoo-chile/l10n\_cl\_dte](https://github.com/odoo-chile/l10n_cl_dte)  
53. facturacion-electronica · GitHub Topics, fecha de acceso: mayo 29, 2026, [https://github.com/topics/facturacion-electronica?l=css](https://github.com/topics/facturacion-electronica?l=css)  
54. facturacion · GitHub Topics, fecha de acceso: mayo 29, 2026, [https://github.com/topics/facturacion](https://github.com/topics/facturacion)  
55. cl-sii 0.23.4 \- PyPI, fecha de acceso: mayo 29, 2026, [https://pypi.org/project/cl-sii/0.23.4/](https://pypi.org/project/cl-sii/0.23.4/)  
56. cordada/lib-cl-sii-python \- GitHub, fecha de acceso: mayo 29, 2026, [https://github.com/cordada/lib-cl-sii-python](https://github.com/cordada/lib-cl-sii-python)  
57. facturacion-electronica-php · GitHub Topics, fecha de acceso: mayo 29, 2026, [https://github.com/topics/facturacion-electronica-php](https://github.com/topics/facturacion-electronica-php)  
58. facturacion · GitHub Topics, fecha de acceso: mayo 29, 2026, [https://github.com/topics/facturacion?l=typescript\&o=asc\&s=updated](https://github.com/topics/facturacion?l=typescript&o=asc&s=updated)