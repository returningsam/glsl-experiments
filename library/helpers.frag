vec2 rotateAroundPoint(vec2 point, vec2 center, float angle) {
    float x = center.x + (point.x-center.x)*cos(angle) - (point.y-center.y)*sin(angle);
    float y = center.y + (point.x-center.x)*sin(angle) + (point.y-center.y)*cos(angle);
    return vec2(x,y);
}

float angleBetween(vec2 v1, vec2 v2) {
    return acos(dot(v1, v2)/(abs(v1)*abs(v2));
}

float max3 (vec3 v) {
    return max (max (v.x, v.y), v.z);
}
