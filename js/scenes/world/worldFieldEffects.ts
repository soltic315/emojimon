import { gameState } from "../../state/gameState.ts";
import { createWeatherParticles } from "../../ui/FXHelper.ts";

export function getFieldPeriodByHour(hour: number) {
  if (hour >= 6 && hour < 11) return { label: "朝", emoji: "🌅", color: 0xfef3c7, alpha: 0.08 };
  if (hour >= 11 && hour < 17) return { label: "昼", emoji: "☀️", color: 0xf8fafc, alpha: 0.03 };
  if (hour >= 17 && hour < 20) return { label: "夕", emoji: "🌇", color: 0xfb923c, alpha: 0.1 };
  return { label: "夜", emoji: "🌙", color: 0x1e293b, alpha: 0.2 };
}

export function getFieldWeatherView(weather: string) {
  switch (weather) {
    case "SUNNY":
      return { label: "晴れ", emoji: "☀️", color: 0xfbbf24, alpha: 0.08 };
    case "RAINY":
      return { label: "雨", emoji: "🌧️", color: 0x60a5fa, alpha: 0.14 };
    case "WINDY":
      return { label: "風", emoji: "🍃", color: 0x4ade80, alpha: 0.09 };
    case "SNOWY":
      return { label: "雪", emoji: "❄️", color: 0xbfdbfe, alpha: 0.15 };
    default:
      return { label: "穏やか", emoji: "⛅", color: 0x94a3b8, alpha: 0.06 };
  }
}

export function refreshFieldTimeWeatherEffects(scene: any, force = false) {
  const timeInfo = gameState.getFieldTime();
  const isInterior = scene._isInteriorMap();
  const weather = isInterior ? "NONE" : (gameState.getMapWeather(scene.mapKey) || "NONE");
  const period = getFieldPeriodByHour(timeInfo.hour);
  const weatherView = isInterior
    ? { label: "屋内", emoji: "🏠", color: 0x94a3b8, alpha: 0 }
    : getFieldWeatherView(weather);
  const weatherChanged = force || scene.lastFieldWeather !== weather;

  if (scene.timeWeatherText) {
    if (isInterior) {
      scene.timeWeatherText.setText(`${period.emoji} ${period.label} ${gameState.getFieldTimeLabel()}   ${weatherView.emoji} ${weatherView.label}`);
    } else {
      scene.timeWeatherText.setText(
        `${period.emoji} ${period.label} ${gameState.getFieldTimeLabel()}   ${weatherView.emoji} ${weatherView.label}`,
      );
    }
  }

  if (scene.timeTintOverlay) {
    scene.timeTintOverlay
      .setFillStyle(period.color, period.alpha)
      .setVisible(true);
  }

  if (scene.weatherTintOverlay) {
    scene.weatherTintOverlay
      .setFillStyle(weatherView.color, weatherView.alpha)
      .setVisible(weather !== "NONE");
  }

  if (weatherChanged) {
    if (scene.weatherParticles) {
      scene.weatherParticles.destroy();
      scene.weatherParticles = null;
    }
    if (weather !== "NONE") {
      scene.weatherParticles = createWeatherParticles(scene, weather);
      if (scene.weatherParticles?.manager) {
        scene.weatherParticles.manager.setScrollFactor(0);
        scene.weatherParticles.manager.setDepth(6);
      }
    }
    scene.lastFieldWeather = weather;
  }
}
