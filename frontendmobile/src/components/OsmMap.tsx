import { createElement, useEffect, useMemo, useRef } from 'react';
import type { ComponentType, Ref } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import type { WebViewMessageEvent, WebViewProps } from 'react-native-webview';

// Los tipos de react-native-webview 14.0.1 declaran las props como `never`
// (WebView<P = undefined>). Este alias solo corrige el tipo, no el comportamiento.
type WebViewHandle = { injectJavaScript: (script: string) => void };
const WebView = RNWebView as unknown as ComponentType<
  WebViewProps & { ref?: Ref<WebViewHandle> }
>;

// Mapa real (OpenStreetMap + Leaflet) que se dibuja dentro de un WebView en el
// celular y dentro de un iframe en la versión web. No necesita claves ni cuentas.
// Leaflet y los mosaicos del mapa se descargan de internet.

export type MapMarker = {
  id: number;
  label: string; // texto dentro del marcador (número de parada o código)
  latitude: number;
  longitude: number;
};

type Props = {
  markers: MapMarker[];
  // Si viene, dibuja el recorrido uniendo estos puntos en orden.
  path?: { latitude: number; longitude: number }[];
  pathColor?: string;
  markerColor: string;
  selectedColor: string;
  textColor: string;
  selectedId?: number | null;
  height: number;
  onSelect?: (id: number) => void;
};

const safeJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

function buildHtml(data: {
  markers: MapMarker[];
  path: { latitude: number; longitude: number }[];
  pathColor: string;
  markerColor: string;
  selectedColor: string;
  textColor: string;
  selectedId: number | null;
}) {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
  .pin { display: flex; align-items: center; justify-content: center; box-sizing: border-box;
    min-width: 26px; height: 26px; padding: 0 6px; border-radius: 13px; border: 3px solid #fff;
    font: 700 11px sans-serif; box-shadow: 0 1px 4px rgba(0,0,0,.5); }
  #err { display:none; position:absolute; inset:0; z-index:1000; align-items:center; justify-content:center;
    text-align:center; font: 14px sans-serif; background:#fff; color:#333; padding:16px; }
</style>
</head><body>
<div id="map"></div>
<div id="err">No se pudo cargar el mapa. Revisa tu conexión a internet.</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var D = ${safeJson(data)};
  function send(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent !== window) window.parent.postMessage(s, '*');
  }
  if (typeof L === 'undefined') { document.getElementById('err').style.display = 'flex'; return; }

  var map = L.map('map', { zoomControl: true, attributionControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  if (D.path.length > 1) {
    var straight = D.path.map(function (p) { return [p.latitude, p.longitude]; });
    var line = L.polyline(straight, { color: D.pathColor, weight: 5, opacity: 0.9 }).addTo(map);
    // Intenta ajustar el trazado a las calles (OSRM, gratuito). Si falla o no hay
    // internet, se queda la línea recta entre paraderos.
    try {
      var coords = D.path.map(function (p) { return p.longitude + ',' + p.latitude; }).join(';');
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
      fetch('https://router.project-osrm.org/route/v1/driving/' + coords +
        '?overview=full&geometries=geojson', ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { return r.json(); })
        .then(function (j) {
          clearTimeout(timer);
          if (j && j.routes && j.routes[0] && j.routes[0].geometry) {
            var pts = j.routes[0].geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
            if (pts.length > 1) line.setLatLngs(pts);
          }
        })
        .catch(function () {});
    } catch (e) {}
  }

  var markers = {};
  function iconFor(m, selected) {
    var bg = selected ? D.selectedColor : D.markerColor;
    var fg = selected ? '#ffffff' : '#ffffff';
    return L.divIcon({
      className: '',
      iconSize: null,
      html: '<div class="pin" style="background:' + bg + ';color:' + fg + ';' +
        (selected ? 'transform:scale(1.25);' : '') + '">' + m.label + '</div>'
    });
  }
  var latlngs = [];
  D.markers.forEach(function (m) {
    var mk = L.marker([m.latitude, m.longitude], { icon: iconFor(m, m.id === D.selectedId) }).addTo(map);
    mk.on('click', function () { send({ type: 'select', id: m.id }); });
    markers[m.id] = { marker: mk, data: m };
    latlngs.push([m.latitude, m.longitude]);
  });

  if (latlngs.length === 1) map.setView(latlngs[0], 16);
  else if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [30, 30] });
  else map.setView([-23.65, -70.4], 13);

  window.setSelected = function (id) {
    Object.keys(markers).forEach(function (k) {
      var e = markers[k];
      e.marker.setIcon(iconFor(e.data, e.data.id === id));
      if (e.data.id === id) e.marker.setZIndexOffset(1000); else e.marker.setZIndexOffset(0);
    });
    var sel = markers[id];
    if (sel) map.panTo(sel.marker.getLatLng());
  };
  window.addEventListener('message', function (ev) {
    try {
      var msg = JSON.parse(ev.data);
      if (msg && msg.type === 'selected') window.setSelected(msg.id);
    } catch (e) {}
  });
})();
</script>
</body></html>`;
}

export function OsmMap({
  markers,
  path = [],
  pathColor = '#28A778',
  markerColor,
  selectedColor,
  textColor,
  selectedId = null,
  height,
  onSelect,
}: Props) {
  const webRef = useRef<WebViewHandle>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const initialSelected = useRef<number | null>(selectedId);

  // El HTML solo se regenera cuando cambian los datos (otro recorrido, otro filtro),
  // no cuando cambia la selección: así el mapa no pierde el zoom del usuario.
  const dataKey = JSON.stringify([markers, path, pathColor, markerColor, selectedColor, textColor]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(
    () =>
      buildHtml({
        markers,
        path,
        pathColor,
        markerColor,
        selectedColor,
        textColor,
        selectedId: initialSelected.current,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataKey],
  );

  useEffect(() => {
    if (selectedId == null) return;
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ type: 'selected', id: selectedId }),
        '*',
      );
    } else {
      webRef.current?.injectJavaScript(
        `window.setSelected && window.setSelected(${Number(selectedId)}); true;`,
      );
    }
  }, [selectedId]);

  // Mensajes desde el mapa hacia la app (web).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (ev: MessageEvent) => {
      if (ev.source !== iframeRef.current?.contentWindow) return;
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.type === 'select') onSelect?.(msg.id);
      } catch {
        // mensaje ajeno al mapa
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSelect]);

  const handleNativeMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'select') onSelect?.(msg.id);
    } catch {
      // mensaje ajeno al mapa
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={{ height }}>
        {createElement('iframe', {
          ref: iframeRef,
          srcDoc: html,
          style: { border: 0, width: '100%', height: '100%' },
          title: 'Mapa',
        })}
      </View>
    );
  }

  return (
    <View style={[styles.box, { height }]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleNativeMessage}
        javaScriptEnabled
        domStorageEnabled
        nestedScrollEnabled
        setSupportMultipleWindows={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', overflow: 'hidden' },
  web: { flex: 1, backgroundColor: 'transparent' },
});
